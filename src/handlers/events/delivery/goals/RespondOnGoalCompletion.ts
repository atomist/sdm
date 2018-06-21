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

import { isGoalRelevant } from "../../../../internal/delivery/goals/support/validateGoal";
import { CredentialsResolver } from "../../../../spi/credentials/CredentialsResolver";
import { sumSdmGoalEventsByOverride } from "./RequestDownstreamGoalsOnGoalSuccess";

import {
    EventFired,
    EventHandler,
    HandleEvent,
    HandlerContext,
    HandlerResult,
    logger,
    Success,
    Value,
} from "@atomist/automation-client";
import { subscription } from "@atomist/automation-client/graph/graphQL";
import { fetchCommitForSdmGoal, fetchGoalsForCommit } from "../../../../api-helper/goal/fetchGoalsOnCommit";
import { addressChannelsFor } from "../../../../api/context/addressChannels";
import { SdmGoal } from "../../../../api/goal/SdmGoal";
import { GoalCompletionListener, GoalCompletionListenerInvocation } from "../../../../api/listener/GoalsSetListener";
import { RepoRefResolver } from "../../../../spi/repo-ref/RepoRefResolver";
import { OnAnyCompletedSdmGoal } from "../../../../typings/types";

/**
 * Respond to a failure or success status by running listeners
 */
@EventHandler("Run a listener on goal failure or success", subscription("OnAnyCompletedSdmGoal"))
export class RespondOnGoalCompletion implements HandleEvent<OnAnyCompletedSdmGoal.Subscription> {

    @Value("token")
    public token: string;

    constructor(private readonly repoRefResolver: RepoRefResolver,
                private readonly credentialsFactory: CredentialsResolver,
                private readonly goalCompletionListeners: GoalCompletionListener[]) {
    }

    public async handle(event: EventFired<OnAnyCompletedSdmGoal.Subscription>,
                        context: HandlerContext): Promise<HandlerResult> {
        const sdmGoal: SdmGoal = event.data.SdmGoal[0] as SdmGoal;

        if (!isGoalRelevant(sdmGoal)) {
            logger.debug(`Goal ${sdmGoal.name} skipped because not relevant for this SDM`);
            return Success;
        }

        if (sdmGoal.state !== "failure" && sdmGoal.state !== "success") { // atomisthq/automation-api#395
            return Promise.resolve(Success);
        }

        const commit = await fetchCommitForSdmGoal(context, sdmGoal);
        const push = commit.pushes[0];
        const id = this.repoRefResolver.repoRefFromPush(push);
        const allGoals: SdmGoal[] = sumSdmGoalEventsByOverride(
            await fetchGoalsForCommit(context, id, sdmGoal.repo.providerId, sdmGoal.goalSetId) as SdmGoal[], [sdmGoal]);

        (this.credentialsFactory as any).githubToken = this.token;

        const gsi: GoalCompletionListenerInvocation = {
            id,
            context,
            credentials: this.credentialsFactory.eventHandlerCredentials(context, id),
            addressChannels: addressChannelsFor(push.repo, context),
            allGoals,
            completedGoal: sdmGoal,
        };

        await Promise.all(this.goalCompletionListeners.map(l => l(gsi)));
        return Success;
    }
}
