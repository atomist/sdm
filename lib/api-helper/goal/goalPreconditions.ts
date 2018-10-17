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

import { logger } from "@atomist/automation-client";
import { sprintf } from "sprintf-js";
import { SdmGoalEvent } from "../../api/goal/SdmGoalEvent";
import { SdmGoalKey } from "../../api/goal/SdmGoalMessage";
import { SdmGoalState } from "../../typings/types";
import {
    goalKeyString,
    mapKeyToGoal,
} from "./sdmGoal";

/*
 * Right now the only preconditions supported are other goals.
 * The intention is that others will be expressed, such as requiring an image.
 */
export function preconditionsAreMet(goal: SdmGoalEvent, info: { goalsForCommit: SdmGoalEvent[]} ): boolean {
    if (!goal.preConditions || goal.preConditions.length === 0) {
        return true;
    }
    const falsification = goal.preConditions.find(p => !satisfied(p, info.goalsForCommit));
    if (falsification) {
        logger.debug("Precondition not met for %s: %s", goalKeyString(goal), goalKeyString(falsification));
        return false;
    }
    logger.debug("All %d preconditions satisfied for %s", goal.preConditions.length, goalKeyString(goal));
    return true;
}

function satisfied(preconditionKey: SdmGoalKey, goalsForCommit: SdmGoalEvent[]): boolean {
    const preconditionGoal = mapKeyToGoal(goalsForCommit)(preconditionKey);
    if (!preconditionGoal) {
        logger.error("Precondition %s not found on commit", goalKeyString(preconditionKey));
        return true;
    }
    switch (preconditionGoal.state) {
        case SdmGoalState.failure:
        case SdmGoalState.skipped:
        case SdmGoalState.canceled:
        case SdmGoalState.stopped:
            logger.info("Precondition %s in state %s, won't be met", goalKeyString(preconditionKey),
                preconditionGoal.state);
            return false;
        case SdmGoalState.planned:
        case SdmGoalState.requested:
        case SdmGoalState.waiting_for_approval:
        case SdmGoalState.approved:
        case SdmGoalState.waiting_for_pre_approval:
        case SdmGoalState.pre_approved:
        case SdmGoalState.in_process:
            logger.debug("Not yet. %s in state %s", goalKeyString(preconditionKey),
                preconditionGoal.state);
            return false;
        case "success":
            return true;
        default:
            throw new Error(sprintf("Unhandled state: %s on %s", preconditionGoal.state,
                goalKeyString(preconditionKey)));
    }
}
