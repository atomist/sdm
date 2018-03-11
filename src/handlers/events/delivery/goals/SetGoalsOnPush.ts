/*
 * Copyright © 201 Atomist, Inc.
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
    GraphQL,
    logger,
    MappedParameter,
    MappedParameters,
    Parameter,
    Secret,
    Secrets,
    Success,
} from "@atomist/automation-client";
import { failureOn } from "@atomist/automation-client/action/ActionResult";
import { Parameters } from "@atomist/automation-client/decorators";
import {
    EventFired,
    EventHandler,
    HandleEvent,
    HandlerContext,
    HandlerResult,
} from "@atomist/automation-client/Handlers";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { Goals } from "../../../../common/goals/Goal";
import { GoalSetter, PushTestInvocation } from "../../../../common/listener/GoalSetter";
import { addressChannelsFor } from "../../../../common/slack/addressChannels";
import { OnPushToAnyBranch } from "../../../../typings/types";
import { createStatus, tipOfDefaultBranch } from "../../../../util/github/ghub";
import { NoGoals } from "./httpServiceGoals";

/**
 * Set up goals on a push (e.g. for delivery).
 */
@EventHandler("Set up goals",
    GraphQL.subscriptionFromFile("graphql/subscription/OnPushToAnyBranch.graphql"))
export class SetGoalsOnPush implements HandleEvent<OnPushToAnyBranch.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    private goalSetters: GoalSetter[];

    /**
     * Configure goal setting
     * @param goalSetters first GoalSetter that returns goals wins
     */
    constructor(...goalSetters: GoalSetter[]) {
        this.goalSetters = goalSetters;
    }

    public async handle(event: EventFired<OnPushToAnyBranch.Subscription>, context: HandlerContext, params: this): Promise<HandlerResult> {
        const push: OnPushToAnyBranch.Push = event.data.Push[0];
        const commit = push.commits[0];
        const id = new GitHubRepoRef(push.repo.owner, push.repo.name, commit.sha);
        const credentials = {token: params.githubToken};
        const project = await GitCommandGitProject.cloned(credentials, id);
        const addressChannels = addressChannelsFor(push.repo, context);
        const pi: PushTestInvocation = {
            id,
            project,
            credentials,
            push,
            context,
            addressChannels,
        };

        try {
            const goalSetterResults: Goals[] = await Promise.all(params.goalSetters
                .map(async pc => {
                    const relevant = !!pc.guard ? await pc.guard(pi) : true;
                    if (relevant) {
                        const goals = pc.chooseGoals(pi);
                        logger.info("Eligible GoalSetter %j returned %j", pc, goals);
                        return Promise.resolve(goals);
                    } else {
                        logger.info("Ineligible GoalSetter %j will not be invoked", pc);
                        return Promise.resolve(undefined);
                    }
                }));
            const determinedGoals = goalSetterResults.find(p => !!p);
            if (determinedGoals === NoGoals) {
                await createStatus(params.githubToken, id, {
                    context: "Immaterial",
                    state: "success",
                    description: "No significant change",
                });
            } else if (!determinedGoals) {
                logger.info("No goals set by push to %s:%s on %s", id.owner, id.repo, push.branch);
            } else {
                await determinedGoals.setAllToPending(id, credentials);
            }
            return Success;
        } catch (err) {
            logger.error("Error determining goals: %s", err);
            await addressChannels(`Serious error trying to determine goals. Please check SDM logs: ${err}`);
            return { code: 1, message: "Failed: " + err };
        }
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

    @Parameter({required: false})
    public sha?: string;
}

export function applyGoalsToCommit(goals: Goals) {
    return async (ctx: HandlerContext,
                  params: { githubToken: string, owner: string, repo: string, sha?: string }) => {
        const sha = params.sha ? params.sha :
            await tipOfDefaultBranch(params.githubToken, new GitHubRepoRef(params.owner, params.repo));
        const id = new GitHubRepoRef(params.owner, params.repo, sha);
        const creds = {token: params.githubToken};

        await goals.setAllToPending(id, creds);
        await ctx.messageClient.respond(":heavy_check_mark: Statuses reset on " + sha);
        return Success;
    };
}
