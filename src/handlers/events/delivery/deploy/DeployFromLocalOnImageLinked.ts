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

import { GraphQL, HandlerResult, Secret, Secrets, Success } from "@atomist/automation-client";
import { EventFired, EventHandler, HandleEvent, HandlerContext } from "@atomist/automation-client/Handlers";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { OnImageLinked } from "../../../../typings/types";
import { ArtifactStore } from "../ArtifactStore";
import {
    currentPhaseIsStillPending,
    GitHubStatusAndFriends,
    Phases,
    PlannedPhase,
    previousPhaseSucceeded,
} from "../Phases";
import { BuiltContext } from "../phases/core";
import { deploy } from "./deploy";
import { Deployer } from "./Deployer";
import { TargetInfo } from "./Deployment";

/**
 * Deploy a published artifact identified in an ImageLinked event.
 */
@EventHandler("Deploy linked artifact",
    GraphQL.subscriptionFromFile("../../../../../../graphql/subscription/OnImageLinked.graphql",
        __dirname))
export class DeployFromLocalOnImageLinked<T extends TargetInfo> implements HandleEvent<OnImageLinked.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    constructor(private phases: Phases,
                private ourPhase: PlannedPhase,
                private endpointPhase: PlannedPhase,
                private artifactStore: ArtifactStore,
                private deployer: Deployer<T>,
                private targeter: (id: RemoteRepoRef) => T) {
    }

    public handle(event: EventFired<OnImageLinked.Subscription>, ctx: HandlerContext, params: this): Promise<HandlerResult> {
        const imageLinked = event.data.ImageLinked[0];
        const commit = imageLinked.commit;

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
        return deploy(params.ourPhase, params.endpointPhase,
            id, params.githubToken, imageLinked.image.imageName,
            params.artifactStore, params.deployer, params.targeter);
    }
}
