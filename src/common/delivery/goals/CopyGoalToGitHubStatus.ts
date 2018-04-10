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

import { EventFired, EventHandler, HandleEvent, HandlerContext, HandlerResult, logger, Success } from "@atomist/automation-client";
import { subscription } from "@atomist/automation-client/graph/graphQL";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { forApproval } from "../../../handlers/events/delivery/verify/approvalGate";
import * as GoalEvent from "../../../ingesters/sdmGoalIngester";
import { SdmGoalState } from "../../../ingesters/sdmGoalIngester";
import { OnAnyGoal, StatusState } from "../../../typings/types";
import { createStatus } from "../../../util/github/ghub";
import { fetchProvider } from "../../../util/github/gitHubProvider";

@EventHandler("Copy every SdmGoal to a GitHub Status", subscription({name: "OnAnyGoal"}))
export class CopyGoalToGitHubStatus implements HandleEvent<OnAnyGoal.Subscription> {

    // TODO: @cd why doesn't this work, it doesn't register for the secret
    // @Secret(Secrets.OrgToken)
    // private readonly githubToken: string = process.env.GITHUB_TOKEN;

    public async handle(event: EventFired<OnAnyGoal.Subscription>, context: HandlerContext, params: this): Promise<HandlerResult> {
        const goal = event.data.SdmGoal[0];
        if (!goal.externalKey) {
            logger.debug("No external key on goal %s. Skipping", goal.name);
            return Success;
        }

        // Too many updates close together get mixed up.
        // For now, skip in_process updates. Someday we may change this,
        // when it's SdmGoals that are displayed in lifecycle and only some
        // of them are copied to statuses. #98
        if ((goal.state as SdmGoalState) === "in_process") {
            logger.debug("Skipping update to %s because in_process updates aren't important enough", goal.externalKey);
            return Success;
        }

        const provider = await fetchProvider(context, goal.repo.providerId);
        const id = GitHubRepoRef.from({
            owner: goal.repo.owner,
            repo: goal.repo.name,
            sha: goal.sha,
            rawApiBase: provider.apiUrl,
            branch: goal.branch,
        });

        const goalState = goal.state as GoalEvent.SdmGoalState;

        const url = goalState === "waiting_for_approval" ? forApproval(goal.url || "https://pretend.atomist.com") : goal.url;

        // TODO this is not what I want to be doing
        await createStatus(process.env.GITHUB_TOKEN, id, {
            context: goal.externalKey,
            description: goal.description,
            target_url: url,
            state: sdmGoalStateToGitHubStatusState(goalState),
        });
        return Success;
    }

}

export function sdmGoalStateToGitHubStatusState(goalState: SdmGoalState): StatusState {
    switch (goalState) {
        case "planned":
        case "requested":
        case "in_process":
            return "pending" as StatusState;
        case "waiting_for_approval":
        case "success":
            return "success" as StatusState;
        case "failure":
        case "skipped":
            return "failure" as StatusState;
        default:
            throw new Error("Unknown goal state " + goalState);
    }
}
