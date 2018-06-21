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

import {
    EventFired,
    EventHandler,
    HandleEvent,
    HandlerContext,
    HandlerResult,
    logger,
    Success,
} from "@atomist/automation-client";
import { subscription } from "@atomist/automation-client/graph/graphQL";
import { fetchGoalsForCommit } from "../../../../api-helper/goal/fetchGoalsOnCommit";
import { goalKeyEquals } from "../../../../api-helper/goal/sdmGoal";
import { updateGoal } from "../../../../api-helper/goal/storeGoals";
import { SdmGoal, SdmGoalKey } from "../../../../api/goal/SdmGoal";
import { isGoalRelevant } from "../../../../internal/delivery/goals/support/validateGoal";
import { RepoRefResolver } from "../../../../spi/repo-ref/RepoRefResolver";
import { OnAnyFailedSdmGoal } from "../../../../typings/types";
import { fetchScmProvider, sumSdmGoalEventsByOverride } from "./RequestDownstreamGoalsOnGoalSuccess";

/**
 * Respond to a failure status by failing downstream goals
 */
@EventHandler("Fail downstream goals on a goal failure", subscription("OnAnyFailedSdmGoal"))
export class SkipDownstreamGoalsOnGoalFailure implements HandleEvent<OnAnyFailedSdmGoal.Subscription> {

    constructor(private readonly repoRefResolver: RepoRefResolver) {}

    // #98: GitHub Status->SdmGoal: We still have to respond to failure on status,
    // until we change all the failure updates to happen on SdmGoal.
    // but we can update the SdmGoals, and let that propagate to the statuses.
    // we can count on all of the statuses we need to update to exist as SdmGoals.
    // however, we can't count on the SdmGoal to have the latest state, so check the Status for that.
    public async handle(event: EventFired<OnAnyFailedSdmGoal.Subscription>,
                        context: HandlerContext,
                        params: this): Promise<HandlerResult> {

        const failedGoal = event.data.SdmGoal[0] as SdmGoal;

        if (!isGoalRelevant(failedGoal)) {
            logger.debug(`Goal ${failedGoal.name} skipped because not relevant for this SDM`);
            return Success;
        }

        if (failedGoal.state !== "failure") { // atomisthq/automation-api#395
            logger.debug(`Nevermind: failure reported when the state was=[${failedGoal.state}]`);
            return Promise.resolve(Success);
        }

        const id = params.repoRefResolver.repoRefFromSdmGoal(failedGoal, await fetchScmProvider(context, failedGoal.repo.providerId));
        const goals: SdmGoal[] = sumSdmGoalEventsByOverride(
            await fetchGoalsForCommit(context, id, failedGoal.repo.providerId, failedGoal.goalSetId) as SdmGoal[],
            [failedGoal]);

        const goalsToSkip = goals.filter(g => isDependentOn(failedGoal, g, mapKeyToGoal(goals)))
            .filter(g => g.state === "planned");

        await Promise.all(goalsToSkip.map(g => updateGoal(context, g, {
            state: "skipped",
            description: `Skipped ${g.name} because ${failedGoal.name} failed`,
        })));

        return Success;
    }
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
