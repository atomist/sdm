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

import {
    EventFired,
    EventHandler,
    HandleEvent,
    HandlerContext,
    HandlerResult,
    logger,
    Secret,
    Secrets,
    Success,
} from "@atomist/automation-client";
import { subscription } from "@atomist/automation-client/graph/graphQL";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { Goal } from "../../../../common/delivery/goals/Goal";
import { updateGoal } from "../../../../common/delivery/goals/storeGoals";
import { findSdmGoalOnCommit } from "../../../../common/delivery/goals/support/fetchGoalsOnCommit";
import {
    ArtifactInvocation,
    ArtifactListener,
} from "../../../../common/listener/ArtifactListener";
import { addressChannelsFor } from "../../../../common/slack/addressChannels";
import { ArtifactStore } from "../../../../spi/artifact/ArtifactStore";
import { OnImageLinked } from "../../../../typings/types";

@EventHandler("Scan when artifact is found", subscription("OnImageLinked"))
export class FindArtifactOnImageLinked implements HandleEvent<OnImageLinked.Subscription> {

    @Secret(Secrets.OrgToken)
    private readonly githubToken: string;

    private readonly listeners: ArtifactListener[];

    /**
     * The goal to update when an artifact is linked.
     * When an artifact is linked to a commit, the build must be done.
     */
    constructor(public goal: Goal,
                private readonly artifactStore: ArtifactStore,
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

        const artifactSdmGoal = await findSdmGoalOnCommit(context, id, commit.repo.org.provider.providerId, params.goal);
        if (!artifactSdmGoal) {
            logger.debug("FindArtifactOnImageLinked: context %s not found for %j", params.goal.context, id);
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

        await updateGoal(context, artifactSdmGoal, {
            state: "success",
            description: params.goal.successDescription,
            url: image.imageName,
        });
        return Success;
    }
}
