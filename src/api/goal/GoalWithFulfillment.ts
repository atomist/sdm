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

import { InterpretLog } from "../../spi/log/InterpretedLog";
import {
    registerRegistrable,
    Registrable,
} from "../machine/registrable";
import { SoftwareDeliveryMachine } from "../machine/SoftwareDeliveryMachine";
import { PushTest } from "../mapping/PushTest";
import { AnyPush } from "../mapping/support/commonPushTests";
import {
    GoalDefinition,
    GoalWithPrecondition,
} from "./Goal";
import { ExecuteGoal } from "./GoalInvocation";
import { ReportProgress } from "./progress/ReportProgress";
import { GoalFulfillmentCallback } from "./support/GoalImplementationMapper";

export type Fulfillment = Implementation | SideEffect;

export interface Implementation {
    name: string;
    goalExecutor: ExecuteGoal;
    logInterpreter: InterpretLog;
    progressReporter?: ReportProgress;
    pushTest?: PushTest;
}

export function isImplementation(f: Fulfillment): f is Implementation {
    return !!f && !!(f as Implementation).goalExecutor && true;
}

export interface SideEffect {
    name: string;
    pushTest?: PushTest;
}

export function isSideEffect(f: Fulfillment): f is SideEffect {
    return !isImplementation(f);
}

/**
 * Goal that registers goal implementations, side effects and callbacks on the
 * current SDM. No additional registration with the SDM is needed.
 */
export abstract class FulfillableGoal extends GoalWithPrecondition implements Registrable {

    private fulfillments: Fulfillment[] = [];
    private callbacks: GoalFulfillmentCallback[] = [];

    constructor(public definition: GoalDefinition) {
        super(definition);
        registerRegistrable(this);
    }

    public register(sdm: SoftwareDeliveryMachine): void {
        this.fulfillments.forEach(fulfillment => {
            if (isImplementation(fulfillment)) {
                sdm.addGoalImplementation(
                    fulfillment.name,
                    this,
                    fulfillment.goalExecutor,
                    {
                        pushTest: fulfillment.pushTest || AnyPush,
                        progressReporter: fulfillment.progressReporter,
                        logInterpreter: fulfillment.logInterpreter,
                    });
            } else if (isSideEffect(fulfillment)) {
                sdm.addGoalSideEffect(this, fulfillment.name, fulfillment.pushTest);
            }
        })
        this.callbacks.forEach(cb => sdm.goalFulfillmentMapper.addFulfillmentCallback(cb));
    }

    protected addFulfillmentCallback(cb: GoalFulfillmentCallback): this {
        this.callbacks.push(cb);
        return this;
    }

    protected addFulfillment(fulfillment: Fulfillment): this {
        this.fulfillments.push(fulfillment);
        return this;
    }
}

/**
 * Goal that accepts registrations of T.
 */
export abstract class FulfillableGoalWithRegistrations<R> extends FulfillableGoal {

    protected registrations: R[] = [];

    constructor(public definition: GoalDefinition) {
        super(definition);
    }

    public with(registration: R): this {
        this.registrations.push(registration);
        return this;
    }
}

/**
 * Goal that accepts registrations of T.
 */
export abstract class FulfillableGoalWithRegistrationsAndListeners<R, L> extends FulfillableGoalWithRegistrations<R> {

    protected listeners: L[] = [];

    constructor(public definition: GoalDefinition) {
        super(definition);
    }

    public withListener(listener: L): this {
        this.listeners.push(listener);
        return this;
    }
}

/**
 * Generic goal that can be used with a GoalDefinition.
 * Register goal implementations or side effects to this goal instance.
 */
export class GoalWithFulfillment extends FulfillableGoal {

    public withCallback(cb: GoalFulfillmentCallback): this {
        this.addFulfillmentCallback(cb);
        return this;
    }

    public with(fulfillment: Fulfillment): this {
        this.addFulfillment(fulfillment);
        return this;
    }
}
