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

import { GraphQL, HandlerResult, logger, Secret, Secrets, Success } from "@atomist/automation-client";
import { EventFired, EventHandler, HandleEvent, HandlerContext } from "@atomist/automation-client/Handlers";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { OnAParticularStatus } from "../../../../../typings/types";
import { createStatus } from "../../../../../util/github/ghub";
import { PlannedPhase } from "../../Phases";
import { K8AutomationDeployContext } from "./RequestDeployOnSuccessStatus";

/**
 * Deploy a published artifact identified in an ImageLinked event.
 */
@EventHandler("Request k8s deploy of linked artifact",
    GraphQL.subscriptionFromFile("graphql/subscription/OnAParticularStatus.graphql", undefined,
        {context: K8AutomationDeployContext}))
export class NoticeK8sDeployCompletionOnStatus implements HandleEvent<OnAParticularStatus.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    /**
     *
     * @param {PlannedPhase} deployPhase
     * @param {PlannedPhase} endpointPhase
     */
    constructor(private deployPhase: PlannedPhase,
                private endpointPhase: PlannedPhase) {
    }

    public async handle(event: EventFired<OnAParticularStatus.Subscription>, ctx: HandlerContext, params: this): Promise<HandlerResult> {
        const status = event.data.Status[0];
        const commit = status.commit;

        if (status.state === "pending") {
            // not interesting
            return Success;
        }

        if (status.context !== K8AutomationDeployContext) {
            logger.warn(`Unexpected event: ${status.context} is ${status.state}`);
            return Success;
        }

        logger.info(`Recognized deploy result. ${status.state} status: ${status.context}: ${status.description}`);

        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);
        await createStatus(params.githubToken, id as GitHubRepoRef, {
            context: params.deployPhase.context,
            state: status.state,
            // todo: don't say "complete" if it failed
            description: "Complete: " + params.deployPhase.name,
            target_url: undefined,
        });
        if (status.state === "success" && status.targetUrl) {
            await createStatus(params.githubToken, id as GitHubRepoRef, {
                context: params.endpointPhase.context,
                state: "success",
                description: "Complete: " + params.endpointPhase.name,
                // we expect k8-automation to have set the targetUrl on its deploy status to the endpoint URL
                target_url: status.targetUrl,
            });
        } else if (status.state === "success") {
            logger.warn("no endpoint URL determined from " + status.context);
        }
        return Success;
    }

}
