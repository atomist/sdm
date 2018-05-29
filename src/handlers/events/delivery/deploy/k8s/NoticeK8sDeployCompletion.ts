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

import { EventFired, EventHandler, HandleEvent, HandlerContext, HandlerResult, logger, Secret, Secrets, Success } from "@atomist/automation-client";
import { subscription } from "@atomist/automation-client/graph/graphQL";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { Goal } from "../../../../../api/goal/Goal";
import { OnAParticularStatus } from "../../../../../typings/types";
import { createStatus } from "../../../../../util/github/ghub";
import { k8AutomationDeployContext, K8TargetBase } from "./RequestK8sDeploys";

export const K8sTestingDomain = "testing";
export const K8sProductionDomain = "production";

// TODO parameterize once we can have multiple handlers

/**
 * Deploy a published artifact identified in an ImageLinked event.
 */
@EventHandler("Request k8s deploy of linked artifact",
    subscription({
        name: "OnAParticularStatus",
        variables: {
            context: k8AutomationDeployContext(K8sTestingDomain),
        }},
    ),
)
export class NoticeK8sTestDeployCompletionOnStatus implements HandleEvent<OnAParticularStatus.Subscription> {

    @Secret(Secrets.OrgToken)
    private readonly githubToken: string;

    /**
     *
     * @param {Goal} deployGoal
     * @param {Goal} endpointGoal
     */
    constructor(private readonly deployGoal: Goal,
                private readonly endpointGoal: Goal) {
    }

    public async handle(event: EventFired<OnAParticularStatus.Subscription>, ctx: HandlerContext, params: this): Promise<HandlerResult> {
        const status = event.data.Status[0];
        const commit = status.commit;

        if (status.state === "pending") { // in_process
            // not interesting
            return Success;
        }

        if (!status.context.startsWith(K8TargetBase)) {
            logger.warn(`Unexpected event: ${status.context} is ${status.state}`);
            return Success;
        }

        logger.info(`Recognized deploy result. ${status.state} status: ${status.context}: ${status.description}`);

        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);
        await createStatus(params.githubToken, id, {
            context: params.deployGoal.context,
            state: status.state,
            // todo: don't say "complete" if it failed
            description: params.deployGoal.successDescription,
            target_url: undefined,
        });
        if (status.state === "success" && status.targetUrl) {
            await createStatus(params.githubToken, id, {
                context: params.endpointGoal.context,
                state: "success",
                description: params.endpointGoal.successDescription,
                // we expect k8-automation to have set the targetUrl on its deploy status to the endpoint URL
                target_url: status.targetUrl,
            });
        } else if (status.state === "success") {
            logger.warn("no endpoint URL determined from " + status.context);
        }
        return Success;
    }

}
