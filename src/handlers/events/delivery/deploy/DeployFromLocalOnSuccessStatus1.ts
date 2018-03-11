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

import { failure, GraphQL, HandleCommand, HandlerResult, logger, Secret, Secrets, Success, } from "@atomist/automation-client";
import { EventFired, EventHandler, HandleEvent, HandlerContext } from "@atomist/automation-client/Handlers";
import { commandHandlerFrom } from "@atomist/automation-client/onCommand";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { buttonForCommand } from "@atomist/automation-client/spi/message/MessageClient";
import { currentGoalIsStillPending, GitHubStatusAndFriends, Goal, } from "../../../../common/goals/Goal";
import { createEphemeralProgressLog } from "../../../../common/log/EphemeralProgressLog";
import { addressChannelsFor } from "../../../../common/slack/addressChannels";
import { ArtifactStore } from "../../../../spi/artifact/ArtifactStore";
import { Deployer } from "../../../../spi/deploy/Deployer";
import { TargetInfo } from "../../../../spi/deploy/Deployment";
import { OnAnySuccessStatus } from "../../../../typings/types";
import { RetryDeployParameters } from "../../../commands/RetryDeploy";
import { deploy } from "./deploy";
import { EventHandlerMetadata } from "@atomist/automation-client/metadata/automationMetadata";


export interface ExecuteGoalOnSuccessStatus {
    implementationName: string;
    githubToken: string;
    goal: Goal;
}

/**
 * Deploy a published artifact identified in an ImageLinked event.
 */
export class ExecuteGoalOnSuccessStatus1<T extends TargetInfo>
    implements HandleEvent<OnAnySuccessStatus.Subscription>,
        ExecuteGoalOnSuccessStatus,
        EventHandlerMetadata {
    subscriptionName: string;
    subscription: string;
    name: string;
    description: string;

    @Secret(Secrets.OrgToken)
    public githubToken: string;


    constructor(public implementationName: string,
                public goal: Goal,
                private execute: (status: OnAnySuccessStatus.Status,
                                  ctx: HandlerContext,
                                  params: ExecuteGoalOnSuccessStatus) => Promise<HandlerResult>) {
        this.subscriptionName = implementationName + "OnSuccessStatus";
        this.name = implementationName + "OnSuccessStatus";
        this.description = `Execute ${goal.name} on prior goal success`;
        this.subscription = GraphQL.subscriptionFromFile("graphql/subscription/OnAnySuccessStatus.graphql");
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

        if (!image) {
            logger.warn(`No image found on commit ${commit.sha}; can't deploy`);
            return failure(new Error("No image linked"));
        }
        return this.execute(status, ctx, params)
    }
}

export interface DeploySpec<T extends TargetInfo> {
    deployGoal: Goal,
    endpointGoal: Goal,
    artifactStore: ArtifactStore,
    deployer: Deployer<T>,
    targeter: (id: RemoteRepoRef) => T,
}

export function executeDeploy<T extends TargetInfo>(spec: DeploySpec<T>) {
    return async (status: OnAnySuccessStatus.Status, ctx: HandlerContext, params: ExecuteGoalOnSuccessStatus) => {
        const commit = status.commit;
        const image = status.commit.image;
        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);
        const deployName = params.implementationName;

        if (!image) {
            logger.warn(`No image found on commit ${commit.sha}; can't deploy`);
            return failure(new Error("No image linked"));
        }

        logger.info(`Running deploy. Triggered by ${status.state} status: ${status.context}: ${status.description}`);
        const retryButton = buttonForCommand({text: "Retry"}, retryCommandNameFor(deployName), {
            repo: commit.repo.name,
            owner: commit.repo.owner,
            sha: commit.sha,
            targetUrl: image.imageName,
        });

        await dedup(commit.sha, () =>
            deploy({
                ...spec,
                id,
                githubToken: params.githubToken,
                targetUrl: image.imageName,
                ac: addressChannelsFor(commit.repo, ctx),
                team: ctx.teamId,
                retryButton,
                logFactory: createEphemeralProgressLog,
            }));

        return Success;
    }
}

function retryCommandNameFor(deployName: string) {
    return "Retry" + deployName;
}

export function retryDeployFromLocal<T extends TargetInfo>(deployName: string,
                                                           spec: DeploySpec<T>): HandleCommand {
    return commandHandlerFrom((ctx: HandlerContext, commandParams: RetryDeployParameters) => {
        return deploy({
            deployGoal: spec.deployGoal,
            endpointGoal: spec.endpointGoal,
            id: new GitHubRepoRef(commandParams.owner, commandParams.repo, commandParams.sha),
            githubToken: commandParams.githubToken,
            targetUrl: commandParams.targetUrl,
            artifactStore: spec.artifactStore,
            deployer: spec.deployer,
            targeter: spec.targeter,
            ac: (msg, opts) => ctx.messageClient.respond(msg, opts),
            team: ctx.teamId,
            retryButton: buttonForCommand({text: "Retry"}, retryCommandNameFor(deployName), {
                ...commandParams,
            }),
            logFactory: createEphemeralProgressLog,
        });
    }, RetryDeployParameters, retryCommandNameFor(deployName));
}

const running = {};

async function dedup<T>(key: string, f: () => Promise<T>): Promise<T | void> {
    if (running[key]) {
        logger.warn("deploy was called twice for " + key);
        return Promise.resolve();
    }
    running[key] = true;
    const promise = f().then(t => {
        running[key] = undefined;
        return t;
    });
    return promise;
}
