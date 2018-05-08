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

import { EventFired, EventHandler, HandleEvent, HandlerContext, HandlerResult, logger, Success, } from "@atomist/automation-client";
import { subscription } from "@atomist/automation-client/graph/graphQL";
import { fetchCommitForSdmGoal, fetchGoalsForCommit } from "../../../../common/delivery/goals/support/fetchGoalsOnCommit";
import { SdmGoal } from "../../../../ingesters/sdmGoalIngester";
import { OnAnyFailedSdmGoal } from "../../../../typings/types";
import { repoRefFromPush } from "../../../../util/git/repoRef";
import { GoalFailureListener, GoalFailureListenerInvocation } from "../../../../common/listener/GoalsSetListener";
import { sumSdmGoalEvents } from "./RequestDownstreamGoalsOnGoalSuccess";
import { addressChannelsFor } from "../../../../common/slack/addressChannels";
import { CredentialsResolver } from "../../../common/CredentialsResolver";

/**
 * Respond to a failure status by running listeners
 */
@EventHandler("Run a listener on goal failure", subscription("OnAnyFailedSdmGoal"))
export class FailDownstreamGoalsOnGoalFailure implements HandleEvent<OnAnyFailedSdmGoal.Subscription> {

    constructor(private readonly credentialsFactory: CredentialsResolver,
                private readonly goalFailureListeners: GoalFailureListener[]) {
    }

    public async handle(event: EventFired<OnAnyFailedSdmGoal.Subscription>,
                        context: HandlerContext): Promise<HandlerResult> {
        const sdmGoal: SdmGoal = event.data.SdmGoal[0] as SdmGoal;

        if (sdmGoal.state !== "failure") { // atomisthq/automation-api#395
            logger.debug(`********* failure reported when the state was=[${sdmGoal.state}]`);
            return Promise.resolve(Success);
        }

        const commit = await fetchCommitForSdmGoal(context, sdmGoal);
        const push = commit.pushes[0];
        const id = repoRefFromPush(push);
        const goals: SdmGoal[] = sumSdmGoalEvents(await fetchGoalsForCommit(context, id, sdmGoal.repo.providerId) as SdmGoal[], [sdmGoal]);

        const gsi: GoalFailureListenerInvocation = {
            id,
            context,
            credentials: this.credentialsFactory.eventHandlerCredentials(context, id),
            addressChannels: addressChannelsFor(push.repo, context),
            goalSet: goals.filter(g => g.goalSetId === sdmGoal.goalSetId),
            failedGoal: sdmGoal,
        };

        await Promise.all(this.goalFailureListeners.map(l => l(gsi)));
        return Success;
    }
}

