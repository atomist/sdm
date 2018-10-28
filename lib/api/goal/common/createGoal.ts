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
import {
    Goal,
    GoalDefinition,
} from "../Goal";
import {
    ExecuteGoal,
    GoalInvocation,
} from "../GoalInvocation";
import { DefaultGoalNameGenerator } from "../GoalNameGenerator";
import { GoalWithFulfillment } from "../GoalWithFulfillment";

/**
 * Minimum information needed to create a goal
 */
export interface EssentialGoalInfo extends Partial<GoalDefinition> {

    displayName: string;

}

/**
 * Create a goal with basic information
 * and an action callback.
 */
export function createGoal(egi: EssentialGoalInfo, goalExecutor: ExecuteGoal): Goal {
    const g = new GoalWithFulfillment({
        uniqueName: DefaultGoalNameGenerator.generateName(egi.displayName),
        ...egi,
    } as GoalDefinition);
    return g.with({
        name: g.definition.uniqueName,
        goalExecutor,
    });
}

/**
 * Rules for waiting for a predicated goal.
 * Specify timeout in seconds or milliseconds.
 */
export interface WaitRules {

    timeoutSeconds?: number;

    timeoutMillis?: number;

    retries?: number;

    condition: (gi: GoalInvocation) => Promise<boolean>;
}

const DefaultWaitRules: Partial<WaitRules> = {
    timeoutSeconds: 1,
    retries: 1000,
};

/**
 * Create a goal from the given executor, waiting until a condition is satisfied,
 * with a given timeout.
 * @param {EssentialGoalInfo} egi
 * @param {ExecuteGoal} goalExecutor
 * @param w rules for waiting
 * @return {Goal}
 */
export function createPredicatedGoal(egi: EssentialGoalInfo,
                                     goalExecutor: ExecuteGoal,
                                     w: WaitRules): Goal {
    if (!!w.timeoutSeconds && !!w.timeoutMillis) {
        throw new Error("Invalid combination: Cannot specify timeoutSeconds and timeoutMillis: Choose one");
    }
    const waitRulesToUse: WaitRules = {
        ...DefaultWaitRules,
        ...w,
    };
    waitRulesToUse.timeoutMillis = waitRulesToUse.timeoutMillis || 1000 * w.timeoutSeconds;
    return createGoal(egi, async gi => {
        for (let tries = 0; tries++;) {
            if (tries > w.retries) {
                throw new Error(`${JSON.stringify(egi)} timed out after max retries: ${JSON.stringify(waitRulesToUse)}`);
            }
            if (await w.condition(gi)) {
                return goalExecutor(gi);
            }
            logger.info("Waiting %d seconds for %j", w.timeoutSeconds, egi);
            await wait(w.timeoutMillis);
        }
    });
}

function wait(timeoutMillis: number): Promise<void> {
    return new Promise<void>(resolve => {
        setTimeout(() => resolve(), timeoutMillis).unref();
    });
}
