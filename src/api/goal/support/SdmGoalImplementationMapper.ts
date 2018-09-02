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

import { InterpretLog } from "../../../spi/log/InterpretedLog";
import { RepoContext } from "../../context/SdmContext";
import { PushListenerInvocation } from "../../listener/PushListener";
import { PushTest } from "../../mapping/PushTest";
import { Goal } from "../Goal";
import { ExecuteGoal } from "../GoalInvocation";
import { ReportProgress } from "../progress/ReportProgress";
import { SdmGoalEvent } from "../SdmGoalEvent";
import { IsolatedGoalLauncher } from "./IsolatedGoalLauncher";

export type GoalFulfillment = GoalImplementation | GoalSideEffect;

export interface GoalImplementation {
    implementationName: string;
    goal: Goal;
    goalExecutor: ExecuteGoal;
    pushTest: PushTest;
    logInterpreter: InterpretLog;
    progressReporter?: ReportProgress;
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
export interface GoalFulfillmentCallback {
    goal: Goal;
    callback: (goal: SdmGoalEvent, context: RepoContext) => Promise<SdmGoalEvent>;
}

/**
 * Registers and looks up goal implementations
 */
export interface SdmGoalImplementationMapper {

    addSideEffect(sideEffect: GoalSideEffect): this;

    addFulfillmentCallback(callback: GoalFulfillmentCallback): this;

    findImplementationBySdmGoal(goal: SdmGoalEvent, inv: PushListenerInvocation): Promise<GoalImplementation>;

    getIsolatedGoalLauncher(): IsolatedGoalLauncher;

    findFulfillmentByPush(goal: Goal, inv: PushListenerInvocation): Promise<GoalFulfillment | undefined>;

    findFulfillmentCallbackForGoal(g: SdmGoalEvent): GoalFulfillmentCallback[];

}
