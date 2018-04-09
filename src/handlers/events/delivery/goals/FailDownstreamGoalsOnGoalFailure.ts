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
    EventHandler, Failure,
    HandleEvent,
    HandlerContext,
    HandlerResult,
    logger,
    Success,
} from "@atomist/automation-client";
import { subscription } from "@atomist/automation-client/graph/graphQL";
import { updateGoal } from "../../../../common/delivery/goals/storeGoals";
import { fetchGoalsForCommit } from "../../../../common/delivery/goals/support/fetchGoalsOnCommit";
import { goalKeyEquals, SdmGoal, SdmGoalKey } from "../../../../ingesters/sdmGoalIngester";
import { OnFailureStatus, OnSuccessStatus, StatusForExecuteGoal } from "../../../../typings/types";
import Status = OnSuccessStatus.Status;
import { providerIdFromStatus, repoRefFromStatus } from "../../../../util/git/repoRef";

/**
 * Respond to a failure status by failing downstream goals
 */
@EventHandler("Fail downstream goals on a goal failure", subscription("OnFailureStatus"))
export class FailDownstreamGoalsOnGoalFailure implements HandleEvent<OnFailureStatus.Subscription> {

    // #98: GitHub Status->SdmGoal: We still have to respond to failure on status,
    // until we change all the failure updates to happen on SdmGoal.
    // but we can update the SdmGoals, and let that propagate to the statuses.
    // we can count on all of the statuses we need to update to exist as SdmGoals.
    // however, we can't count on the SdmGoal to have the latest state, so check the Status for that.
    public async handle(event: EventFired<OnFailureStatus.Subscription>,
                        ctx: HandlerContext): Promise<HandlerResult> {
        const status: Status = event.data.Status[0];

        if (status.state !== "failure") { // atomisthq/automation-api#395 (probably not an issue for Status but will be again for SdmGoal)
            logger.debug(`********* failure reported when the state was=[${status.state}]`);
            return Promise.resolve(Success);
        }

        if (status.description.startsWith("Skip")) {
            logger.debug("not relevant, because I set this status to failure in an earlier invocation of myself.");
            logger.debug(`context: ${status.context} description: ${status.description}`);
            return Promise.resolve(Success);
        }

        const id = repoRefFromStatus(status);
        const goals = await fetchGoalsForCommit(ctx, id, providerIdFromStatus(status));
        const failedGoal = goals.find(g => g.externalKey === status.context) as SdmGoal;
        if (!failedGoal) {
            logger.warn("Could not identify %s among %j", status.context, goals.map(g => g.externalKey));
            return Failure;
        }
        const goalsToSkip = goals.filter(g => isDependentOn(failedGoal, g as SdmGoal, mapKeyToGoal(goals as SdmGoal[])))
            .filter(g => stillWaitingForPreconditions(status, g as SdmGoal));

        await Promise.all(goalsToSkip.map(g => updateGoal(ctx, g as SdmGoal, {
            state: "skipped",
            description: `Skipped ${g.name} because ${failedGoal.name} failed`,
        })));

        return Success;
    }
}

// in the future this will be trivial but right now we need to look at GH Statuses
function stillWaitingForPreconditions(status: StatusForExecuteGoal.Fragment, sdmGoal: SdmGoal): boolean {
    const correspondingStatus = status.commit.statuses.find(s => s.context === sdmGoal.externalKey);
    return correspondingStatus.state === "pending";
}

function mapKeyToGoal<T extends SdmGoalKey>(goals: T[]): (SdmGoalKey) => T {
    return (keyToFind: SdmGoalKey) => {
        const found = goals.find(g => goalKeyEquals(keyToFind, g));
        return found;
    };
}

function isDependentOn(failedGoal: SdmGoalKey, goal: SdmGoal, preconditionToGoal: (g: SdmGoalKey) => SdmGoal): boolean {
    if (!goal) {
        // TODO we think this is caused by automation-api#396
        logger.warn("Internal error: Trying to work out if %j is dependent on null or undefined goal", failedGoal);
        return false;
    }
    if (!goal.preConditions || goal.preConditions.length === 0) {
        return false; // no preconditions? not dependent
    }
    if (mapKeyToGoal(goal.preConditions)(failedGoal)) {
        return true; // the failed goal is one of my preconditions? dependent
    }
    // otherwise, recurse on my preconditions
    return !!goal.preConditions
        .map(precondition => isDependentOn(failedGoal, preconditionToGoal(precondition), preconditionToGoal))
        .find(a => a); // if one is true, return true
}
