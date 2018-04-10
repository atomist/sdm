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

import { EventFired, EventHandler, HandleEvent, HandlerContext, HandlerResult, logger, Success } from "@atomist/automation-client";
import { subscription } from "@atomist/automation-client/graph/graphQL";
import { updateGoal } from "../../../../common/delivery/goals/storeGoals";
import { fetchGoalsForCommit } from "../../../../common/delivery/goals/support/fetchGoalsOnCommit";
import { SdmGoal } from "../../../../ingesters/sdmGoalIngester";
import { OnAnySuccessStatus } from "../../../../typings/types";
import { providerIdFromStatus, repoRefFromStatus } from "../../../../util/git/repoRef";

/**
 * #98: this is temporary, until Lifecycle-automation is changed to mark goals approved
 */
@EventHandler("When Lifecycle marks a status approved, copy that to the goal",
    subscription("OnAnySuccessStatus"))
export class CopyStatusApprovalToGoal implements HandleEvent<OnAnySuccessStatus.Subscription> {

    public async handle(event: EventFired<OnAnySuccessStatus.Subscription>,
                        ctx: HandlerContext): Promise<HandlerResult> {
        const status = event.data.Status[0];

        if (!status.description.includes("approved by ")) {
            logger.debug("not an approval: " + status.description);
            return Success;
        }

        const sdmGoal = (await fetchGoalsForCommit(ctx, repoRefFromStatus(status), providerIdFromStatus(status)))
            .find(sg => sg.externalKey === status.context) as SdmGoal;

        if (!sdmGoal) {
            logger.warn("Goal not found for approval status: %j", status);
            return Success;
        }

        if (sdmGoal.state !== "waiting_for_approval") {
            logger.info(`Got an approval status for %s, but its state was %s so I didn't do anything`,
                sdmGoal.externalKey, sdmGoal.state);
            return Success;
        }

        await updateGoal(ctx, sdmGoal, {
            state: "success",
            description: status.description,
        });

        return Success;
    }
}
