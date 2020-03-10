/*
 * Copyright © 2020 Atomist, Inc.
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

/** Information needed to create a goal side effect. */
export interface GoalSideEffect {
    /** Name of goal side effect.  It should be unique. */
    sideEffectName: string;
    /** Goal on which to associated the side effect. */
    goal: Goal;
    /**
     * Push test that when true the side effect will be triggered.  If
     * not provided, [[AnyPush]] is used.
     */
    pushTest?: PushTest;
    /**
     * Name of SDM executing side effect.  If not provided, the
     * current SDM registration name will be used.
     */
    registration?: string;
}

export function isGoalSideEffect(f: GoalFulfillment): f is GoalSideEffect {
    return !!f && (f as GoalSideEffect).sideEffectName && (f as GoalSideEffect).goal && true;
}

export function isGoalFulfillment(g: { fulfillment?: PlannedGoal["fulfillment"]}):
    g is { fulfillment: PlannedGoal["fulfillment"]} {
    return !!g && !!g.fulfillment && !!g.fulfillment.name && !!g.fulfillment.registration;
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
