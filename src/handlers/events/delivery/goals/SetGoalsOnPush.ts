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
import { OnPushToAnyBranch, PushFields } from "../../../../typings/types";
import { providerIdFromPush, repoRefFromPush } from "../../../../util/git/repoRef";
import { ProjectLoader } from "../../../../common/repo/ProjectLoader";
import { GoalSetter } from "../../../../common/listener/GoalSetter";
import { GoalsSetInvocation, GoalsSetListener } from "../../../../common/listener/GoalsSetListener";
import { SdmGoalImplementationMapper } from "../../../../common/delivery/goals/SdmGoalImplementationMapper";
import { SdmGoalSideEffectMapper } from "../../../../common/delivery/goals/SdmGoalSideEffectMapper";
import { AddressChannels, addressChannelsFor } from "../../../../common/slack/addressChannels";
import { constructSdmGoal, constructSdmGoalImplementation, storeGoal } from "../../../../common/delivery/goals/storeGoals";
import { Goals } from "../../../../common/delivery/goals/Goals";
import { SdmGoal, SdmGoalFulfillment } from "../../../../ingesters/sdmGoalIngester";
import { ProjectListenerInvocation } from "../../../../common/listener/Listener";
import { Goal, hasPreconditions } from "../../../../common/delivery/goals/Goal";
import { ExecuteGoalWithLog } from "../../../../common/delivery/deploy/runWithLog";
import { PushRules } from "../../../../common/listener/support/PushRules";

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
                private readonly implementationMapping: SdmGoalImplementationMapper,
                private readonly sideEffectMapping: SdmGoalSideEffectMapper) {

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
            sideEffectMapping: params.sideEffectMapping,
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
    sideEffectMapping: SdmGoalSideEffectMapper,
},                                      parameters: {
    context: HandlerContext,
    credentials: ProjectOperationCredentials,
    push: PushFields.Fragment,
}) {
    const {projectLoader, goalsListeners, goalSetters, implementationMapping, sideEffectMapping} = rules;
    const {context, credentials, push} = parameters;
    const id = repoRefFromPush(push);
    const providerId = providerIdFromPush(push);
    const addressChannels = addressChannelsFor(push.repo, context);


    const {determinedGoals, goalsToSave} = await determineGoals(
        {projectLoader, goalSetters, implementationMapping, sideEffectMapping}, {
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
                                         sideEffectMapping: SdmGoalSideEffectMapper,
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
    const {projectLoader, goalSetters, implementationMapping, sideEffectMapping} = rules;
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
            const goalsToSave = determinedGoals.goals.map(g =>
                constructSdmGoal(context, {
                    goalSet: determinedGoals.name,
                    goal: g,
                    state: hasPreconditions(g) ? "planned" : "requested",
                    id,
                    providerId,
                    fulfillment: fulfillment({implementationMapping, sideEffectMapping}, g, pli),
                }));

            return {determinedGoals, goalsToSave};
        });

}

function fulfillment(rules: {
    implementationMapping: SdmGoalImplementationMapper,
    sideEffectMapping: SdmGoalSideEffectMapper,
},                   g: Goal, inv: ProjectListenerInvocation): SdmGoalFulfillment {
    const {implementationMapping, sideEffectMapping} = rules;
    const implementation = implementationMapping.findByPush(g, inv);
    if (implementation) {
        return constructSdmGoalImplementation(implementation);
    }
    if (sideEffectMapping.findByGoal(g)) {
        return {method: "side-effect", name: sideEffectMapping.findByGoal(g).sideEffectName};
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
