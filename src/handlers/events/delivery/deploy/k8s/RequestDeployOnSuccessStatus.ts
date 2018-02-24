/*
 * Copyright © 2017 Atomist, Inc.
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

import { failure, GraphQL, HandlerResult, logger, Secret, Secrets, Success } from "@atomist/automation-client";
import { EventFired, EventHandler, HandleEvent, HandlerContext } from "@atomist/automation-client/Handlers";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { OnAnySuccessStatus } from "../../../../../typings/types";
import { createStatus } from "../../../../commands/editors/toclient/ghub";
import { currentPhaseIsStillPending, GitHubStatusAndFriends, Phases, PlannedPhase, previousPhaseSucceeded } from "../../Phases";

export const K8AutomationDeployContext = "deploy/atomist/k8s/testing";

/**
 * Deploy a published artifact identified in an ImageLinked event.
 */
@EventHandler("Request k8s deploy of linked artifact",
    GraphQL.subscriptionFromFile("graphql/subscription/OnAnySuccessStatus.graphql"))
export class RequestK8sDeployOnSuccessStatus implements HandleEvent<OnAnySuccessStatus.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    /**
     *
     * @param {Phases} phases
     * @param {PlannedPhase} ourPhase
     * @param {PlannedPhase} endpointPhase
     */
    constructor(private phases: Phases,
                private deployPhase: PlannedPhase) {
    }

    public async handle(event: EventFired<OnAnySuccessStatus.Subscription>, ctx: HandlerContext, params: this): Promise<HandlerResult> {
        const status = event.data.Status[0];
        const commit = status.commit;
        const image = status.commit.image;

        console.log("remove me");

        const statusAndFriends: GitHubStatusAndFriends = {
            context: status.context,
            state: status.state,
            targetUrl: status.targetUrl,
            description: status.description,
            siblings: status.commit.statuses,
        };

        // TODO: continue as long as everything before me has succeeded, regardless of whether this is the triggering on
        // (this is related to the next two TODOs)
        if (!previousPhaseSucceeded(params.phases, params.deployPhase.context, statusAndFriends)) {
            return Promise.resolve(Success);
        }

        if (!currentPhaseIsStillPending(params.deployPhase.context, statusAndFriends)) {
            return Promise.resolve(Success);
        }

        // TODO: if any status is failed, do not deploy

        if (!image) {
            logger.warn(`No image found on commit ${commit.sha}; can't deploy`);
            return Promise.resolve(failure(new Error("No image linked")));
        }

        logger.info(`Requesting deploy. Triggered by ${status.state} status: ${status.context}: ${status.description}`);

        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);
        await createStatus(params.githubToken, id as GitHubRepoRef, {
            context: K8AutomationDeployContext,
            state: "pending",
            description: "Requested deploy by k8-automation",
            target_url: image.imageName,
        });
        await createStatus(params.githubToken, id as GitHubRepoRef, {
            context: params.deployPhase.context,
            description: "Working on " + params.deployPhase.name,
            state: "pending",
            target_url: undefined,
        });
        return Success;
    }

}
