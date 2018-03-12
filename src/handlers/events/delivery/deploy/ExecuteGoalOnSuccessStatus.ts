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

import { failure, GraphQL, HandleCommand, HandlerResult, logger, Secrets, Success } from "@atomist/automation-client";
import { EventFired, HandleEvent, HandlerContext } from "@atomist/automation-client/Handlers";
import { EventHandlerMetadata } from "@atomist/automation-client/metadata/automationMetadata";
import { commandHandlerFrom } from "@atomist/automation-client/onCommand";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { buttonForCommand } from "@atomist/automation-client/spi/message/MessageClient";
import { currentGoalIsStillPending, GitHubStatusAndFriends, Goal } from "../../../../common/goals/Goal";
import { createEphemeralProgressLog } from "../../../../common/log/EphemeralProgressLog";
import { addressChannelsFor } from "../../../../common/slack/addressChannels";
import { ArtifactStore } from "../../../../spi/artifact/ArtifactStore";
import { Deployer } from "../../../../spi/deploy/Deployer";
import { TargetInfo } from "../../../../spi/deploy/Deployment";
import { OnAnySuccessStatus } from "../../../../typings/types";
import { RetryDeployParameters } from "../../../commands/RetryDeploy";
import { deploy } from "./deploy";

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
        this.subscription = GraphQL.replaceOperationName(
            GraphQL.subscriptionFromFile("graphql/subscription/OnAnySuccessStatus.graphql"),
            this.subscriptionName);
    }

    public async handle(event: EventFired<OnAnySuccessStatus.Subscription>, ctx: HandlerContext, params: this): Promise<HandlerResult> {
        const status = event.data.Status[0];
        const commit = status.commit;
        const image = status.commit.image;
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

        // TODO why is this tied to image? Isn't it generic
        if (!image) {
            logger.warn(`No image found on commit ${commit.sha}; can't deploy`);
            return failure(new Error("No image linked"));
        }
        return this.execute(status, ctx, params);
    }
}
