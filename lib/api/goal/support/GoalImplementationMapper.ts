/*
 * Copyright © 2019 Atomist, Inc.
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
import {
    ExecuteGoal,
    GoalProjectListenerRegistration,
} from "../GoalInvocation";
import { PlannedGoal } from "../GoalWithFulfillment";
import { ReportProgress } from "../progress/ReportProgress";
import { SdmGoalEvent } from "../SdmGoalEvent";

export type GoalFulfillment = GoalImplementation | GoalSideEffect;

export interface GoalImplementation {
    implementationName: string;
    goal: Goal;
    goalExecutor: ExecuteGoal;
    pushTest: PushTest;
    logInterpreter: InterpretLog;
    progressReporter?: ReportProgress;
    projectListeners: GoalProjectListenerRegistration | GoalProjectListenerRegistration[];
}

export function isGoalImplementation(f: GoalFulfillment): f is GoalImplementation {
    return !!f && !!(f as GoalImplementation).implementationName && true;
}

export interface GoalSideEffect {
    sideEffectName: string;
    registration: string;
    goal: Goal;
    pushTest: PushTest;
}

export function isGoalSideEffect(f: GoalFulfillment): f is GoalSideEffect {
    return !!f && (f as GoalSideEffect).sideEffectName &&  (f as GoalSideEffect).registration && true;
}

export function isGoalFulfillment(g: any): g is PlannedGoal["fulfillment"] {
    return !!g && !!(g as PlannedGoal["fulfillment"]).name && !!(g as PlannedGoal["fulfillment"]).registration;
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
export interface GoalImplementationMapper {

    hasImplementation(): boolean;

    addSideEffect(sideEffect: GoalSideEffect): this;

    addFulfillmentCallback(callback: GoalFulfillmentCallback): this;

    findImplementationBySdmGoal(goal: SdmGoalEvent): GoalImplementation;

    findFulfillmentByPush(goal: Goal, inv: PushListenerInvocation): Promise<GoalFulfillment | undefined>;

    findFulfillmentCallbackForGoal(g: SdmGoalEvent): GoalFulfillmentCallback[];

    findGoalBySdmGoal(g: SdmGoalEvent): Goal | undefined;

}
