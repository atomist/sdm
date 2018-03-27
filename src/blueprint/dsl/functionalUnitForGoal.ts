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

import { HandleEvent } from "@atomist/automation-client";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { Goal, hasPreconditions } from "../../common/delivery/goals/Goal";
import { GoalExecutor } from "../../common/delivery/goals/goalExecution";
import { triggerGoal } from "../../handlers/commands/triggerGoal";
import { ExecuteGoalOnRequested } from "../../handlers/events/delivery/ExecuteGoalOnRequested";
import { ExecuteGoalOnSuccessStatus } from "../../handlers/events/delivery/ExecuteGoalOnSuccessStatus";
import { FunctionalUnit } from "../FunctionalUnit";

export function functionalUnitForGoal(implementationName: string, goal: Goal, executor: GoalExecutor): FunctionalUnit {
    const eventHandlers: Array<Maker<HandleEvent<any>>> = [
        () => new ExecuteGoalOnRequested(implementationName, goal, executor, true),
    ];
    if (hasPreconditions(goal)) {
        eventHandlers.push(() => new ExecuteGoalOnSuccessStatus(implementationName, goal, executor, true));
    }
    return {
        eventHandlers,
        commandHandlers: [() => triggerGoal(implementationName, goal)],
    };
}
