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

import {
    EventFired,
    GraphQL,
    HandleEvent,
    HandlerContext,
    HandlerResult,
    logger,
    Secrets,
    Success,
} from "@atomist/automation-client";
import { EventHandlerMetadata } from "@atomist/automation-client/metadata/automationMetadata";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import {
    currentGoalIsStillPending,
    GitHubStatusAndFriends,
    Goal,
} from "../../../../common/goals/Goal";
import { TargetInfo } from "../../../../spi/deploy/Deployment";
import { OnAnySuccessStatus } from "../../../../typings/types";
import { setDeployStatus } from "./deploy";
import { createStatus } from "../../../../util/github/ghub";

export interface ExecuteGoalInvocation {
    implementationName: string;
    githubToken: string;
    goal: Goal;
}

export type Executor = (status: OnAnySuccessStatus.Status,
                        ctx: HandlerContext,
                        params: ExecuteGoalInvocation) => Promise<HandlerResult>;

/**
 * Deploy a published artifact identified in an ImageLinked event.
 */
export class ExecuteGoalOnSuccessStatus<T extends TargetInfo>
    implements HandleEvent<OnAnySuccessStatus.Subscription>,
        ExecuteGoalInvocation,
        EventHandlerMetadata {

    public subscriptionName: string;
    public subscription: string;
    public name: string;
    public description: string;
    public secrets = [{name: "githubToken", uri: Secrets.OrgToken}];

    public githubToken: string;

    constructor(public implementationName: string,
                public goal: Goal,
                private execute: Executor) {
        this.subscriptionName = implementationName + "OnSuccessStatus";
        this.name = implementationName + "OnSuccessStatus";
        this.description = `Execute ${goal.name} on prior goal success`;
        this.subscription = GraphQL.inlineQuery(GraphQL.replaceOperationName(
            GraphQL.subscriptionFromFile(
                "../../../../graphql/subscription/OnAnySuccessStatus",
                __dirname),
            this.subscriptionName));
    }

    public async handle(event: EventFired<OnAnySuccessStatus.Subscription>,
                        ctx: HandlerContext,
                        params: this): Promise<HandlerResult> {
        const status = event.data.Status[0];
        const commit = status.commit;

        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);
        const statusAndFriends: GitHubStatusAndFriends = {
            context: status.context,
            state: status.state,
            targetUrl: status.targetUrl,
            description: status.description,
            siblings: status.commit.statuses,
        };
        const creds = {token: params.githubToken};

        if (!await params.goal.preconditionsMet(creds, id, statusAndFriends)) {
            logger.info("Preconditions not met for goal %s on %j", params.goal.name, id);
            return Success;
        }

        if (!currentGoalIsStillPending(params.goal.context, statusAndFriends)) {
            return Success;
        }

        logger.info(`Running ${params.goal.name}. Triggered by ${status.state} status: ${status.context}: ${status.description}`);

        await createStatus(params.githubToken, id as GitHubRepoRef, {
            context: params.goal.context,
            description: params.goal.workingDescription,
            state: "pending",
        }).catch(err =>
                logger.warn(`Failed to update ${params.goal.name} status to tell people we are working on it`));

        return this.execute(status, ctx, params);
    }
}
