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

import { GraphQL, HandleCommand, HandlerResult, Secret, Secrets, success, Success } from "@atomist/automation-client";
import { EventFired, EventHandler, HandleEvent, HandlerContext } from "@atomist/automation-client/Handlers";
import { commandHandlerFrom } from "@atomist/automation-client/onCommand";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { buttonForCommand } from "@atomist/automation-client/spi/message/MessageClient";
import { OnImageLinked } from "../../../../typings/types";
import { addressChannelsFor } from "../../../commands/editors/toclient/addressChannels";
import { EventWithCommand, RetryDeployParameters } from "../../../commands/RetryDeploy";
import { ArtifactStore } from "../ArtifactStore";
import {
    currentPhaseIsStillPending,
    GitHubStatusAndFriends,
    Phases,
    PlannedPhase,
    previousPhaseSucceeded,
} from "../Phases";
import { BuiltContext } from "../phases/gitHubContext";
import { deploy } from "./deploy";
import { Deployer } from "./Deployer";
import { TargetInfo } from "./Deployment";

/**
 * Deploy a published artifact identified in an ImageLinked event.
 */
@EventHandler("Deploy linked artifact",
    GraphQL.subscriptionFromFile("graphql/subscription/OnImageLinked.graphql"))
export class DeployFromLocalOnImageLinked<T extends TargetInfo> implements HandleEvent<OnImageLinked.Subscription>, EventWithCommand {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    /**
     *
     * @param {Phases} phases
     * @param {PlannedPhase} ourPhase
     * @param {PlannedPhase} endpointPhase
     * @param {ArtifactStore} artifactStore
     * @param {Deployer<T extends TargetInfo>} deployer
     * @param {(id: RemoteRepoRef) => T} targeter tells what target to use for this repo.
     * For example, we may wish to deploy different repos to different Cloud Foundry spaces
     * or Kubernetes clusters
     */
    constructor(private phases: Phases,
                private ourPhase: PlannedPhase,
                private endpointPhase: PlannedPhase,
                private artifactStore: ArtifactStore,
                public deployer: Deployer<T>,
                private targeter: (id: RemoteRepoRef) => T) {
    }

    public get commandName() {
        return "RetryDeployLocal";
    }

    public correspondingCommand(): HandleCommand {
        return commandHandlerFrom((ctx: HandlerContext, commandParams: RetryDeployParameters) => {
            return deploy({
                deployPhase: this.ourPhase,
                endpointPhase: this.endpointPhase,
                id: new GitHubRepoRef(commandParams.owner, commandParams.repo, commandParams.sha),
                githubToken: commandParams.githubToken,
                targetUrl: commandParams.targetUrl,
                artifactStore: this.artifactStore,
                deployer: this.deployer,
                targeter: this.targeter,
                ac: (msg, opts) => ctx.messageClient.respond(msg, opts),
                retryButton: buttonForCommand({text: "Retry"}, this.commandName, {
                    ...commandParams,
                }),
            });
        }, RetryDeployParameters, this.commandName);
    }

    public handle(event: EventFired<OnImageLinked.Subscription>, ctx: HandlerContext, params: this): Promise<HandlerResult> {
        const imageLinked = event.data.ImageLinked[0];
        const commit = imageLinked.commit;

        const retryButton = buttonForCommand({text: "Retry"}, this.commandName, {
            repo: commit.repo.name,
            owner: commit.repo.owner,
            sha: commit.sha,
            targetUrl: imageLinked.image.imageName,
        });

        // TODO doesn't work as built status isn't in, yet
        // const builtStatus = commit.statuses.find(status => status.context === BuiltContext);
        // if (!builtStatus) {
        //     console.log(`Deploy: builtStatus not found`);
        //     return Promise.resolve(Success);
        // }
        const statusAndFriends: GitHubStatusAndFriends = {
            context: BuiltContext,
            state: "success", // builtStatus.state,
            targetUrl: "xxx",
            siblings: imageLinked.commit.statuses,
        };

        if (!previousPhaseSucceeded(params.phases, params.ourPhase.context, statusAndFriends)) {
            return Promise.resolve(Success);
        }

        if (!currentPhaseIsStillPending(params.ourPhase.context, statusAndFriends)) {
            return Promise.resolve(Success);
        }

        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);
        return deploy({
            deployPhase: params.ourPhase, endpointPhase: params.endpointPhase,
            id, githubToken: params.githubToken,
            targetUrl: imageLinked.image.imageName,
            artifactStore: this.artifactStore,
            deployer: params.deployer,
            targeter: params.targeter,
            ac: addressChannelsFor(commit.repo, ctx),
            retryButton,
        }).then(success);
    }
}
