/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
    EventFired,
    EventHandler,
    HandleEvent,
    HandlerContext,
    HandlerResult,
    logger,
    MappedParameter,
    MappedParameters,
    Parameter,
    Secret,
    Secrets,
    Success,
} from "@atomist/automation-client";
import { Parameters } from "@atomist/automation-client/decorators";
import { subscription } from "@atomist/automation-client/graph/graphQL";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { ExecuteGoalWithLog } from "../../../../common/delivery/goals/support/runWithLog";
import { Goal, hasPreconditions } from "../../../../common/delivery/goals/Goal";
import { Goals } from "../../../../common/delivery/goals/Goals";
import { isGoalImplementation, isSideEffect, SdmGoalImplementationMapper } from "../../../../common/delivery/goals/SdmGoalImplementationMapper";
import { constructSdmGoal, constructSdmGoalImplementation, storeGoal } from "../../../../common/delivery/goals/storeGoals";
import { GoalSetter } from "../../../../common/listener/GoalSetter";
import { GoalsSetInvocation, GoalsSetListener } from "../../../../common/listener/GoalsSetListener";
import { ProjectListenerInvocation } from "../../../../common/listener/Listener";
import { PushRules } from "../../../../common/listener/support/PushRules";
import { ProjectLoader } from "../../../../common/repo/ProjectLoader";
import { AddressChannels, addressChannelsFor } from "../../../../common/slack/addressChannels";
import { SdmGoal, SdmGoalFulfillment } from "../../../../ingesters/sdmGoalIngester";
import { OnPushToAnyBranch, PushFields } from "../../../../typings/types";
import { providerIdFromPush, repoRefFromPush } from "../../../../util/git/repoRef";

/**
 * Set up goalSet on a push (e.g. for delivery).
 */
@EventHandler("Set up goalSet", subscription("OnPushToAnyBranch"))
export class SetGoalsOnPush implements HandleEvent<OnPushToAnyBranch.Subscription> {

    @Secret(Secrets.OrgToken)
    private readonly githubToken: string;

    /**
     * Configure goal setting
     * @param projectLoader use to load projects
     * @param goalSetters first GoalSetter that returns goalSet wins
     */
    constructor(private readonly projectLoader,
                private readonly goalSetters: GoalSetter[],
                private readonly goalsListeners: GoalsSetListener[],
                private readonly implementationMapping: SdmGoalImplementationMapper) {

    }

    public async handle(event: EventFired<OnPushToAnyBranch.Subscription>,
                        context: HandlerContext,
                        params: this): Promise<HandlerResult> {
        const push: OnPushToAnyBranch.Push = event.data.Push[0];

        const credentials = {token: params.githubToken};

        await chooseAndSetGoals({
            projectLoader: params.projectLoader,
            goalsListeners: params.goalsListeners,
            goalSetters: params.goalSetters,
            implementationMapping: params.implementationMapping,
        }, {
            context,
            credentials,
            push,
        });

        return Success;
    }
}

export async function chooseAndSetGoals(rules: {
    projectLoader: ProjectLoader,
    goalsListeners: GoalsSetListener[],
    goalSetters: GoalSetter[],
    implementationMapping: SdmGoalImplementationMapper,
},                                      parameters: {
    context: HandlerContext,
    credentials: ProjectOperationCredentials,
    push: PushFields.Fragment,
}) {
    const {projectLoader, goalsListeners, goalSetters, implementationMapping} = rules;
    const {context, credentials, push} = parameters;
    const id = repoRefFromPush(push);
    const providerId = providerIdFromPush(push);
    const addressChannels = addressChannelsFor(push.repo, context);

    const {determinedGoals, goalsToSave} = await determineGoals(
        {projectLoader, goalSetters, implementationMapping}, {
        credentials, id, providerId, context, push, addressChannels,
    });

    await Promise.all(goalsToSave.map(g => storeGoal(context, g)));

    // Let GoalSetListeners know even if we determined no goals.
    // This is not an error
    const gsi: GoalsSetInvocation = {
        id,
        context,
        credentials,
        goalSet: determinedGoals,
        addressChannels: addressChannelsFor(push.repo, context),
    };
    await
        Promise.all(goalsListeners.map(l => l(gsi)));

    return determinedGoals;
}

export async function determineGoals(rules: {
                                         projectLoader: ProjectLoader,
                                         goalSetters: GoalSetter[],
                                         implementationMapping: SdmGoalImplementationMapper,
                                     },
                                     circumstances: {
                                         credentials: ProjectOperationCredentials, id: GitHubRepoRef,
                                         providerId: string,
                                         context: HandlerContext,
                                         push: PushFields.Fragment,
                                         addressChannels: AddressChannels,
                                     }): Promise<{
    determinedGoals: Goals | undefined,
    goalsToSave: SdmGoal[],
}> {
    const {projectLoader, goalSetters, implementationMapping} = rules;
    const {credentials, id, context, push, providerId, addressChannels} = circumstances;
    return projectLoader.doWithProject({credentials, id, context, readOnly: true},
        async project => {
            const determinedGoals: Goals = await chooseGoalsForPushOnProject({
                goalSetters,
            }, {
                push,
                id,
                credentials,
                context,
                project,
                addressChannels,
            });

            if (!determinedGoals) {
                return {determinedGoals: undefined, goalsToSave: []};
            }
            const pli: ProjectListenerInvocation = {
                project,
                credentials,
                id,
                push,
                context,
            };
            const goalsToSave = await Promise.all(determinedGoals.goals.map(async g =>
                constructSdmGoal(context, {
                    goalSet: determinedGoals.name,
                    goal: g,
                    state: hasPreconditions(g) ? "planned" : "requested",
                    id,
                    providerId,
                    fulfillment: await fulfillment({implementationMapping}, g, pli),
                })));

            return {determinedGoals, goalsToSave};
        });

}

async function fulfillment(rules: {
    implementationMapping: SdmGoalImplementationMapper,
},                         g: Goal, inv: ProjectListenerInvocation): Promise<SdmGoalFulfillment> {
    const {implementationMapping} = rules;
    const plan = await implementationMapping.findFulfillmentByPush(g, inv);
    if (isGoalImplementation(plan)) {
        return constructSdmGoalImplementation(plan);
    }
    if (isSideEffect(plan)) {
        return {method: "side-effect", name: plan.sideEffectName };
    }

    logger.info("FYI, no implementation found for " + g.name);
    return {method: "other", name: "unspecified-yo"};
}

export const executeImmaterial: ExecuteGoalWithLog = async () => {
    logger.debug("Nothing to do here");
    return Success;
};

async function chooseGoalsForPushOnProject(rules: { goalSetters: GoalSetter[] },
                                           parameters: {
                                            push: PushFields.Fragment,
                                            id: GitHubRepoRef,
                                            credentials: ProjectOperationCredentials,
                                            context: HandlerContext,
                                            project: GitProject,
                                            addressChannels: AddressChannels,
                                        }): Promise<Goals> {
    const {goalSetters} = rules;
    const {push, id, credentials, context, project, addressChannels} = parameters;
    const pi: ProjectListenerInvocation = {
        id,
        project,
        credentials,
        push,
        context,
        addressChannels,
    };

    try {
        const pushRules = new PushRules("Goal setter", goalSetters);
        const determinedGoals: Goals = await pushRules.valueForPush(pi);
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

@Parameters()
export class ApplyGoalsParameters {
    @Secret(Secrets.UserToken)
    public githubToken: string;

    @MappedParameter(MappedParameters.GitHubOwner)
    public owner: string;

    @MappedParameter(MappedParameters.GitHubRepository)
    public repo: string;

    @MappedParameter(MappedParameters.GitHubRepositoryProvider)
    public providerId: string;

    @Parameter({required: false})
    public sha?: string;
}
