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

import { CredentialsResolver } from "../../../common/CredentialsResolver";
import { sumSdmGoalEventsByOverride } from "./RequestDownstreamGoalsOnGoalSuccess";

import { EventFired, EventHandler, HandleEvent, HandlerContext, HandlerResult, logger, Success } from "@atomist/automation-client";
import { subscription } from "@atomist/automation-client/graph/graphQL";
import {
    fetchCommitForSdmGoal,
    fetchGoalsForCommit,
    GoalCompletionListener,
    GoalCompletionListenerInvocation,
    OnAnyCompletedSdmGoal,
} from "../../../..";
import { addressChannelsFor } from "../../../../common/slack/addressChannels";
import { SdmGoal } from "../../../../ingesters/sdmGoalIngester";
import { repoRefFromPush } from "../../../../util/git/repoRef";

/**
 * Respond to a failure or success status by running listeners
 */
@EventHandler("Run a listener on goal failure or success", subscription("OnAnyCompletedSdmGoal"))
export class RespondOnGoalCompletion implements HandleEvent<OnAnyCompletedSdmGoal.Subscription> {

    constructor(private readonly credentialsFactory: CredentialsResolver,
                private readonly goalCompletionListeners: GoalCompletionListener[]) {
    }

    public async handle(event: EventFired<OnAnyCompletedSdmGoal.Subscription>,
                        context: HandlerContext): Promise<HandlerResult> {
        const sdmGoal: SdmGoal = event.data.SdmGoal[0] as SdmGoal;

        if (sdmGoal.state !== "failure" && sdmGoal.state !== "success") { // atomisthq/automation-api#395
            logger.debug(`********* completion reported when the state was=[${sdmGoal.state}]`);
            return Promise.resolve(Success);
        }

        const commit = await fetchCommitForSdmGoal(context, sdmGoal);
        const push = commit.pushes[0];
        const id = repoRefFromPush(push);
        const goals: SdmGoal[] = sumSdmGoalEventsByOverride(await fetchGoalsForCommit(context, id, sdmGoal.repo.providerId) as SdmGoal[], [sdmGoal]);

        const gsi: GoalCompletionListenerInvocation = {
            id,
            context,
            credentials: this.credentialsFactory.eventHandlerCredentials(context, id),
            addressChannels: addressChannelsFor(push.repo, context),
            goalSet: goals.filter(g => g.goalSetId === sdmGoal.goalSetId),
            completedGoal: sdmGoal,
        };

        await Promise.all(this.goalCompletionListeners.map(l => l(gsi)));
        return Success;
    }
}
