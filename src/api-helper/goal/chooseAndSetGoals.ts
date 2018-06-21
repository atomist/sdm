/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { HandlerContext, logger, Success } from "@atomist/automation-client";
import { guid } from "@atomist/automation-client/internal/util/string";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { AddressChannels, addressChannelsFor } from "../../api/context/addressChannels";
import { ExecuteGoalWithLog } from "../../api/goal/ExecuteGoalWithLog";
import { Goal, hasPreconditions } from "../../api/goal/Goal";
import { Goals } from "../../api/goal/Goals";
import { SdmGoal, SdmGoalFulfillment } from "../../api/goal/SdmGoal";
import { isGoalImplementation, isSideEffect, SdmGoalImplementationMapper } from "../../api/goal/support/SdmGoalImplementationMapper";
import { GoalsSetListener, GoalsSetListenerInvocation } from "../../api/listener/GoalsSetListener";
import { PushListenerInvocation } from "../../api/listener/PushListener";
import { GoalSetter } from "../../api/mapping/GoalSetter";
import { ProjectLoader } from "../../spi/project/ProjectLoader";
import { RepoRefResolver } from "../../spi/repo-ref/RepoRefResolver";
import { PushFields } from "../../typings/types";
import { constructSdmGoal, constructSdmGoalImplementation, storeGoal } from "./storeGoals";

export interface ChooseAndSetGoalsRules {
    projectLoader: ProjectLoader;
    repoRefResolver: RepoRefResolver;
    goalsListeners: GoalsSetListener[];
    goalSetter: GoalSetter;
    implementationMapping: SdmGoalImplementationMapper;
}

/**
 * Choose and set goals for this push
 * @param {ChooseAndSetGoalsRules} rules
 * @param {{context: HandlerContext; credentials: ProjectOperationCredentials; push: PushFields.Fragment}} parameters
 * @return {Promise<Goals | undefined>}
 */
export async function chooseAndSetGoals(rules: ChooseAndSetGoalsRules,
                                        parameters: {
                                            context: HandlerContext,
                                            credentials: ProjectOperationCredentials,
                                            push: PushFields.Fragment,
                                        }): Promise<Goals | undefined> {
    const {projectLoader, goalsListeners, goalSetter, implementationMapping, repoRefResolver} = rules;
    const {context, credentials, push} = parameters;
    const id = repoRefResolver.repoRefFromPush(push);
    const addressChannels = addressChannelsFor(push.repo, context);
    const goalSetId = guid();

    const {determinedGoals, goalsToSave} = await determineGoals(
        {projectLoader, repoRefResolver, goalSetter, implementationMapping}, {
            credentials, id, context, push, addressChannels, goalSetId,
        });

    await Promise.all(goalsToSave.map(g => storeGoal(context, g)));

    // Let GoalSetListeners know even if we determined no goals.
    // This is not an error
    const gsi: GoalsSetListenerInvocation = {
        id,
        context,
        credentials,
        addressChannels: addressChannelsFor(push.repo, context),
        goalSetId,
        goalSet: determinedGoals,
    };
    await Promise.all(goalsListeners.map(l => l(gsi)));
    return determinedGoals;
}

export async function determineGoals(rules: {
                                         projectLoader: ProjectLoader,
                                         repoRefResolver: RepoRefResolver,
                                         goalSetter: GoalSetter,
                                         implementationMapping: SdmGoalImplementationMapper,
                                     },
                                     circumstances: {
                                         credentials: ProjectOperationCredentials,
                                         id: RemoteRepoRef,
                                         context: HandlerContext,
                                         push: PushFields.Fragment,
                                         addressChannels: AddressChannels,
                                         goalSetId: string,
                                     }): Promise<{
    determinedGoals: Goals | undefined,
    goalsToSave: SdmGoal[],
}> {
    const {projectLoader, repoRefResolver, goalSetter, implementationMapping} = rules;
    const {credentials, id, context, push, addressChannels, goalSetId} = circumstances;
    return projectLoader.doWithProject({credentials, id, context, readOnly: true}, async project => {
        const pli: PushListenerInvocation = {
            project,
            credentials,
            id,
            push,
            context,
            addressChannels,
        };
        const determinedGoals = await chooseGoalsForPushOnProject({goalSetter}, pli);
        if (!determinedGoals) {
            return {determinedGoals: undefined, goalsToSave: []};
        }
        const goalsToSave = await sdmGoalsFromGoals(implementationMapping, repoRefResolver, pli, determinedGoals, goalSetId);
        return {determinedGoals, goalsToSave};
    });

}

async function sdmGoalsFromGoals(implementationMapping: SdmGoalImplementationMapper,
                                 repoRefResolver: RepoRefResolver,
                                 pli: PushListenerInvocation,
                                 determinedGoals: Goals,
                                 goalSetId: string) {
    return Promise.all(determinedGoals.goals.map(async g =>
        constructSdmGoal(pli.context, {
            goalSet: determinedGoals.name,
            goalSetId,
            goal: g,
            state: hasPreconditions(g) ? "planned" : "requested",
            id: pli.id,
            providerId: repoRefResolver.providerIdFromPush(pli.push),
            fulfillment: await fulfillment({implementationMapping}, g, pli),
        })));
}

async function fulfillment(rules: {
    implementationMapping: SdmGoalImplementationMapper,
},                         g: Goal, inv: PushListenerInvocation): Promise<SdmGoalFulfillment> {
    const {implementationMapping} = rules;
    const plan = await implementationMapping.findFulfillmentByPush(g, inv);
    if (isGoalImplementation(plan)) {
        return constructSdmGoalImplementation(plan);
    }
    if (isSideEffect(plan)) {
        return {method: "side-effect", name: plan.sideEffectName};
    }

    logger.warn("FYI, no implementation found for '%s'", g.name);
    return {method: "other", name: "unspecified-yo"};
}

export const executeImmaterial: ExecuteGoalWithLog = async () => {
    logger.debug("Immaterial: Nothing to execute");
    return Success;
};

async function chooseGoalsForPushOnProject(rules: { goalSetter: GoalSetter },
                                           pi: PushListenerInvocation): Promise<Goals> {
    const {goalSetter} = rules;
    const {push, id, addressChannels} = pi;

    try {
        const determinedGoals: Goals = await goalSetter.mapping(pi);
        if (!determinedGoals) {
            logger.info("No goals set by push to %s:%s on %s", id.owner, id.repo, push.branch);
        } else {
            logger.info("Goals for push on %j are %s", id, determinedGoals.name);
        }
        return determinedGoals;
    } catch (err) {
        logger.error("Error determining goals: %s", err);
        await addressChannels(`Serious error trying to determine goals. Please check SDM logs: ${err}`);
        throw err;
    }
}
