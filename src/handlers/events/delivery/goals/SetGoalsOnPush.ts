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
import { GoalExecutor } from "../../../../common/delivery/goals/goalExecution";
import { Goals } from "../../../../common/delivery/goals/Goals";
import { GoalSetter } from "../../../../common/listener/GoalSetter";
import { GoalsSetInvocation, GoalsSetListener } from "../../../../common/listener/GoalsSetListener";
import { ProjectListenerInvocation } from "../../../../common/listener/Listener";
import { PushMapping } from "../../../../common/listener/PushMapping";
import { PushRules } from "../../../../common/listener/support/PushRules";
import { ProjectLoader } from "../../../../common/repo/ProjectLoader";
import { addressChannelsFor } from "../../../../common/slack/addressChannels";
import { OnPushToAnyBranch, PushFields } from "../../../../typings/types";
import { providerIdFromPush, repoRefFromPush } from "../../../../util/git/repoRef";
import { hasPreconditions } from "../../../../common/delivery/goals/Goal";
import { constructSdmGoal, storeGoal } from "../../../../common/delivery/goals/storeGoals";

/**
 * Set up goalSet on a push (e.g. for delivery).
 */
@EventHandler("Set up goalSet", subscription("OnPushToAnyBranch"))
export class SetGoalsOnPush implements HandleEvent<OnPushToAnyBranch.Subscription> {

    @Secret(Secrets.OrgToken)
    private readonly githubToken: string;

    private readonly rules: PushMapping<Goals>;

    /**
     * Configure goal setting
     * @param projectLoader use to load projects
     * @param goalSetters first GoalSetter that returns goalSet wins
     */
    constructor(private readonly projectLoader: ProjectLoader,
                private readonly goalSetters: GoalSetter[],
                private readonly goalsListeners: GoalsSetListener[]) {

    }

    public async handle(event: EventFired<OnPushToAnyBranch.Subscription>,
                        context: HandlerContext,
                        params: this): Promise<HandlerResult> {
        const push: OnPushToAnyBranch.Push = event.data.Push[0];

        const credentials = {token: params.githubToken};

        await chooseAndSetGoals(context, params.projectLoader, credentials, push, params.goalsListeners, params.goalSetters);

        return Success;
    }
}

export async function chooseAndSetGoals(context: HandlerContext,
                                        projectLoader: ProjectLoader,
                                        credentials: ProjectOperationCredentials,
                                        push: PushFields.Fragment,
                                        goalsListeners: GoalsSetListener[],
                                        goalSetters: GoalSetter[]) {
    const id = repoRefFromPush(push);

    const determinedGoals = await projectLoader.doWithProject({credentials, id, context, readOnly: true},
        project => setGoalsForPushOnProject(push, id, credentials, context, project, goalSetters));

    if (!!determinedGoals) {
        await saveGoals(context, credentials, id, providerIdFromPush(push), determinedGoals);
    }

    // Let GoalSetListeners know even if we determined no goals.
    // This is not an error
    const gsi: GoalsSetInvocation = {
        id,
        context,
        credentials,
        goalSet: determinedGoals,
        addressChannels: addressChannelsFor(push.repo, context),
    };
    await Promise.all(goalsListeners.map(l => l(gsi)));

    return determinedGoals;
}

async function saveGoals(ctx: HandlerContext,
                         credentials: ProjectOperationCredentials,
                         id: GitHubRepoRef,
                         providerId: string,
                         determinedGoals: Goals) {
    return Promise.all([
        ...determinedGoals.goals.map(goal =>
            storeGoal(ctx, constructSdmGoal(ctx, {
                goalSet: this.name,
                goal,
                state: hasPreconditions(goal) ? "planned" : "requested",
                id,
                providerId,
            })))]);
}

export const executeImmaterial: GoalExecutor = async () => {
    logger.debug("Nothing to do here");
    return Success;
};

async function setGoalsForPushOnProject(push: OnPushToAnyBranch.Push,
                                        id: GitHubRepoRef,
                                        credentials: ProjectOperationCredentials,
                                        context: HandlerContext,
                                        project: GitProject,
                                        goalSetters: GoalSetter[]): Promise<Goals> {
    const addressChannels = addressChannelsFor(push.repo, context);
    const pi: ProjectListenerInvocation = {
        id,
        project,
        credentials,
        push,
        context,
        addressChannels,
    };

    try {
        const rules = new PushRules("Goal setter", goalSetters);
        const determinedGoals: Goals = await rules.valueForPush(pi);
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
