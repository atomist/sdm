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

import * as _ from "lodash";
import { Goal } from "../../api/goal/Goal";
import { ExecuteGoal } from "../../api/goal/GoalInvocation";
import { SoftwareDeliveryMachineConfiguration } from "../../api/machine/SoftwareDeliveryMachineOptions";

/**
 * Enum to describe goal sizes when creating mock goal executors
 */
export enum MockGoalSize {
    Small = 5,
    Medium = 20,
    Large = 60,
    ExtraLarge = 90,
}

/**
 * Options to configure mocks for one particular goal
 */
export interface MockGoal {
    goal: Goal;
    size: MockGoalSize | number;
    result?: number;
    mock?: ExecuteGoal;
}

/**
 * Options for the mock goal executor support
 */
export interface MockOptions {
    enabled: boolean;
    defaultSize?: MockGoalSize | number;
    goals?: MockGoal[];
    randomBy?: number;
}

/**
 * Default mock options to be merged into custom options provided on configuration.sdm.mock
 */
export const DefaultMockOptions: MockOptions = {
    enabled: false,
    defaultSize: MockGoalSize.Medium,
    goals: [],
    randomBy: 0.2,
};

/**
 * Create mock goal executor for a certain goal
 * @param goal
 * @param configuration
 */
export function mockGoalExecutor(goal: Goal, configuration: SoftwareDeliveryMachineConfiguration): ExecuteGoal | undefined {
    const options = _.merge(DefaultMockOptions, _.get(configuration, "sdm.mock", {})) as MockOptions;

    if (options && options.enabled) {
        const mock = options.goals.find(g => g.goal === goal);
        if (mock) {
            if (mock.mock) {
                return mock.mock;
            } else {
                return createGoalExecutor(randomize(mock.size, options.randomBy), mock.result);
            }
        } else {
            return createGoalExecutor(randomize(options.defaultSize, options.randomBy));
        }
    }

    return undefined;
}

export function randomize(size: MockGoalSize | number, randomBy: number): number {
    const base = getSize(size);
    const random = base * randomBy;
    const min = base - random;
    const max = base + random;
    return Math.floor(Math.random() * (max - min) + min);
}

function getSize(size: MockGoalSize | number): number {
    if (typeof size === "number") {
        return size;
    } else {
        return +size;
    }
}

function createGoalExecutor(seconds: number, code: number = 0): ExecuteGoal {
    return async gi => {
        gi.progressLog.write(`Waiting for ${seconds}s`);
        await wait(seconds);
        gi.progressLog.write(`Finished waiting for ${seconds}s`);
        return {
            code,
        };
    };
}

function wait(seconds: number): Promise<void> {
    return new Promise<void>(resolve => {
        setTimeout(() => resolve(), seconds * 1000).unref();
    });
}
