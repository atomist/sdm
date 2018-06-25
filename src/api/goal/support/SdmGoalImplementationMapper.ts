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

import { SdmGoal } from "../../../api/goal/SdmGoal";
import { InterpretLog } from "../../../spi/log/InterpretedLog";
import { RepoContext } from "../../context/SdmContext";
import { PushListenerInvocation } from "../../listener/PushListener";
import { PushTest } from "../../mapping/PushTest";
import { ExecuteGoalWithLog } from "../ExecuteGoalWithLog";
import { Goal } from "../Goal";
import { IsolatedGoalLauncher } from "./IsolatedGoalLauncher";

export type GoalFulfillment = GoalImplementation | GoalSideEffect;

export interface GoalImplementation {
    implementationName: string;
    goal: Goal;
    goalExecutor: ExecuteGoalWithLog;
    pushTest: PushTest;
    logInterpreter: InterpretLog;
}

export function isGoalImplementation(f: GoalFulfillment): f is GoalImplementation {
    return !!f && !!(f as GoalImplementation).implementationName && true;
}

export interface GoalSideEffect {
    sideEffectName: string;
    goal: Goal;
    pushTest: PushTest;
}

export function isSideEffect(f: GoalFulfillment): f is GoalSideEffect {
    return !!f && (f as GoalSideEffect).sideEffectName && true;
}

/**
 * Callback to allow changes to the goal before it gets fullfilled.
 *
 * This is useful to add goal specific information to the data field.
 */
export interface GoalFullfillmentCallback {
    goal: Goal;
    callback: (goal: SdmGoal, context: RepoContext) => Promise<SdmGoal>;
}

/**
 * Registers and looks up goal implementations
 */
export interface SdmGoalImplementationMapper {

    addSideEffect(sideEffect: GoalSideEffect): this;

    addFullfillmentCallback(callback: GoalFullfillmentCallback): this;

    findImplementationBySdmGoal(goal: SdmGoal): GoalImplementation;

    getIsolatedGoalLauncher(): IsolatedGoalLauncher;

    findFulfillmentByPush(goal: Goal, inv: PushListenerInvocation): Promise<GoalFulfillment | undefined>;

    findFullfillmentCallbackForGoal(g: SdmGoal): GoalFullfillmentCallback[];

}
