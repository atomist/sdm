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
import { SdmGoal, SdmGoalKey } from "../../api/goal/SdmGoal";
import { goalKeyString, mapKeyToGoal } from "./sdmGoal";

/*
 * Right now the only preconditions supported are other goals.
 * The intention is that others will be expressed, such as requiring an image.
 */
export function preconditionsAreMet(goal: SdmGoal, info: {
    goalsForCommit: SdmGoal[], // I would like to make this optional and fetch if needed not provided
}): boolean {
    if (!goal.preConditions || goal.preConditions.length === 0) {
        return true;
    }
    const falsification = goal.preConditions.find(p => !satisfied(p, info.goalsForCommit));
    if (falsification) {
        logger.debug("Precondition not met for %s: %s", goalKeyString(goal), goalKeyString(falsification));
        return false;
    }
    logger.debug("All %d preconditions satisfied for %s", goal.preConditions.length);
    return true;
}

function satisfied(preconditionKey: SdmGoalKey, goalsForCommit: SdmGoal[]): boolean {
    const preconditionGoal = mapKeyToGoal(goalsForCommit)(preconditionKey);
    if (!preconditionGoal) {
        // TODO CD I'd suggest that goals that have a precondition that doesn't exist in the goal set
        // are satisfied
        logger.error("Precondition %s not found on commit", goalKeyString(preconditionKey));
        return true;
    }
    switch (preconditionGoal.state) {
        case "failure":
        case "skipped":
            logger.info("Precondition %s in state %s, won't be met", goalKeyString(preconditionKey),
                preconditionGoal.state);
            return false;
        case "planned":
        case "requested":
        case "waiting_for_approval":
        case "in_process":
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
