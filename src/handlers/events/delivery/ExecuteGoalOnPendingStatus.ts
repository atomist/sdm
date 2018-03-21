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

import { EventFired, failure, GraphQL, HandleEvent, HandlerContext, HandlerResult, logger, Secrets, Success } from "@atomist/automation-client";
import { EventHandlerMetadata } from "@atomist/automation-client/metadata/automationMetadata";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { ProjectOperationCredentials, TokenCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { Goal } from "../../../common/delivery/goals/Goal";
import { ExecuteGoalInvocation, GoalExecutor, StatusForExecuteGoal } from "../../../common/delivery/goals/goalExecution";
import { PushTest } from "../../../common/listener/PushTest";
import { Builder } from "../../../spi/build/Builder";
import { OnAnyPendingStatus, StatusState } from "../../../typings/types";
import { createStatus } from "../../../util/github/ghub";
import { executeGoal } from "./ExecuteGoalOnSuccessStatus";
import { forApproval } from "./verify/approvalGate";

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
                private execute: GoalExecutor,
                private handleGoalUpdates: boolean = false) {
        this.subscriptionName = implementationName + "OnPending";
        this.subscription = GraphQL.inlineQuery(GraphQL.replaceOperationName(
            GraphQL.subscriptionFromFile("../../../graphql/subscription/OnAnyPendingStatus", __dirname),
            this.subscriptionName));
        this.name = implementationName + "OnPendingStatus";
        this.description = `Execute ${goal.name} when requested`;
    }

    public async handle(event: EventFired<OnAnyPendingStatus.Subscription>,
                        ctx: HandlerContext,
                        params: this): Promise<HandlerResult> {
        const status: StatusForExecuteGoal.Status = event.data.Status[0];

        // TODO: put this in a subscription parameter. It should work, in this architecture
        if (status.context !== params.goal.context) {
            logger.debug(`Received pending: ${status.context}. Not triggering ${params.goal.context}`);
            return Success;
        }
        // this will change when we have Goal events that don't double-up the pending bit
        if (status.description === params.goal.workingDescription) {
            logger.debug("[%s] is working", status.context);
            return Success;
        }
        if (status.description !== params.goal.requestedDescription) {
            logger.warn("This pending status doesn't look right: " + status.context + " expected: " + params.goal.requestedDescription);
        }

        try {
            const result = await executeGoal(this.execute, status, ctx, params);
            if (params.handleGoalUpdates) {
                await markStatus(repoRef(status), params.goal,
                    result.code === 0 ? StatusState.success : StatusState.failure,
                    credentials(params),
                    result.targetUrl,
                    result.requireApproval);
            }
            return Success;
        } catch (err) {
            logger.info("Error executing %s on %s", params.implementationName, repoRef(status).url, err);
            if (params.handleGoalUpdates) {
                await markStatus(repoRef(status), params.goal, StatusState.error, credentials);
            }
            return failure(err);
        }
    }
}

function repoRef(status: StatusForExecuteGoal.Status) {
    const commit = status.commit;
    return new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);
}

function credentials(inv: ExecuteGoalInvocation) {
    return { token: inv.githubToken };
}

const ScanBase = "https://scan.atomist.com";

function markStatus(id: GitHubRepoRef, goal: Goal, state: StatusState,
                    creds: ProjectOperationCredentials, targetUrl?: string, requireApproval?: boolean): Promise<any> {
    const baseUrl = `${ScanBase}/${id.owner}/${id.repo}/${id.sha}`;
    return createStatus((creds as TokenCredentials).token, id, {
        state,
        target_url: requireApproval ? forApproval(targetUrl || baseUrl) : targetUrl,
        context: goal.context,
        description: state === StatusState.success ? goal.completedDescription : goal.failedDescription,
    });
}
