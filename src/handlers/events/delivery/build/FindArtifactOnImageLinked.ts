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
import { Goal } from "../../../../common/goals/Goal";
import { ArtifactInvocation, ArtifactListener } from "../../../../common/listener/ArtifactListener";
import { addressChannelsFor } from "../../../../common/slack/addressChannels";
import { ArtifactStore } from "../../../../spi/artifact/ArtifactStore";
import { OnImageLinked } from "../../../../typings/types";
import { createStatus } from "../../../../util/github/ghub";

@EventHandler("Set build goal to complete with link to artifact",
    GraphQL.subscriptionFromFile("graphql/subscription/OnImageLinked.graphql"))
export class FindArtifactOnImageLinked implements HandleEvent<OnImageLinked.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    private listeners: ArtifactListener[];

    /**
     * The goal to update when an artifact is linked.
     * When an artifact is linked to a commit, the build must be done.
     */
    constructor(public goal: Goal,
                private artifactStore: ArtifactStore,
                ...listeners: ArtifactListener[]) {
        this.listeners = listeners;
    }

    public async handle(event: EventFired<OnImageLinked.Subscription>,
                        context: HandlerContext,
                        params: this): Promise<HandlerResult> {
        const imageLinked = event.data.ImageLinked[0];
        const commit = imageLinked.commit;
        const image = imageLinked.image;
        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);

        const builtStatus = commit.statuses.find(status => status.context === params.goal.context);
        if (!builtStatus) {
            logger.info("FindArtifactOnImageLinked: builtStatus not found for %j", id);
            return Success;
        }

        if (params.listeners.length > 0) {
            const credentials = {token: params.githubToken};
            logger.info("FindArtifactOnImageLinked: Scanning artifact for %j", id);
            const deployableArtifact = await params.artifactStore.checkout(image.imageName, id, credentials);
            const addressChannels = addressChannelsFor(commit.repo, context);
            const ai: ArtifactInvocation = {
                id,
                context,
                addressChannels,
                deployableArtifact,
                credentials,
            };
            await Promise.all(params.listeners.map(l => l(ai)));
        }

        await createStatus(params.githubToken, id, {
            state: "success",
            description: `${params.goal.completedDescription} ${image.imageName}`,
            context: params.goal.context,
        });
        return Success;
    }
}
