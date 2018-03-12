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
import { PushTest } from "../../../../common/listener/GoalSetter";
import { Builder } from "../../../../spi/build/Builder";
import { OnAnyPendingStatus } from "../../../../typings/types";
import {
    ExecuteGoalInvocation,
    Executor,
} from "../deploy/ExecuteGoalOnSuccessStatus";

/**
 * Implemented by classes that can choose a builder based on project content etc.
 */
export interface ConditionalBuilder {

    guard: PushTest;

    builder: Builder;
}

export class ExecuteGoalOnPendingStatus implements HandleEvent<OnAnyPendingStatus.Subscription>,
    ExecuteGoalInvocation, EventHandlerMetadata {

    public subscriptionName: string;
    public subscription: string;
    public name: string;
    public description: string;
    public secrets = [{name: "githubToken", uri: Secrets.OrgToken}];

    public githubToken: string;

    constructor(public implementationName: string,
                public goal: Goal,
                private execute: Executor) {
        this.subscriptionName = implementationName + "OnPending";
        this.subscription = GraphQL.inlineQuery(GraphQL.replaceOperationName(
            GraphQL.subscriptionFromFile("../../../../graphql/subscription/OnAnyPendingStatus", __dirname),
            this.subscriptionName));
        this.name = implementationName + "OnPendingStatus";
        this.description = `Execute ${goal.name} when requested`;
    }

    public async handle(event: EventFired<OnAnyPendingStatus.Subscription>,
                        ctx: HandlerContext,
                        params: this): Promise<HandlerResult> {
        const status = event.data.Status[0];
        logger.info("Might execute " + params.goal.name + " on " + params.implementationName + " after receiving pending status " + status.context);
        const commit = status.commit;

        const statusAndFriends: GitHubStatusAndFriends = {
            context: status.context,
            state: status.state,
            targetUrl: status.targetUrl,
            description: status.description,
            siblings: status.commit.statuses,
        };

        const credentials = {token: params.githubToken};
        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);

        if (!await params.goal.preconditionsMet(credentials, id, statusAndFriends)) {
            logger.debug("Build preconditions not met");
            return Success;
        }

        if (!currentGoalIsStillPending(params.goal.context, statusAndFriends)) {
            return Success;
        }

        logger.info(`Running ${params.goal.name}. Triggered by ${status.state} status: ${status.context}: ${status.description}`);
        return params.execute(status, ctx, params);
    }
}
