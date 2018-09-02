import { AnyPush } from "../..";
import { sdmInstance } from "../../api-helper/machine/AbstractSoftwareDeliveryMachine";
import { InterpretLog } from "../../spi/log/InterpretedLog";
import { SoftwareDeliveryMachine } from "../machine/SoftwareDeliveryMachine";
import { PushTest } from "../mapping/PushTest";
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
export abstract class FulfillableGoal extends GoalWithPrecondition {

    constructor(public definition: GoalDefinition,
                protected sdm: SoftwareDeliveryMachine = sdmInstance()) {
        super(definition);
    }

    protected addFulfillmentCallback(cb: GoalFulfillmentCallback): this {
        this.sdm.goalFulfillmentMapper.addFulfillmentCallback(cb);
        return this;
    }

    protected addFulfillment(fulfillment: Fulfillment): void {
        if (isImplementation(fulfillment)) {
            this.sdm.addGoalImplementation(
                fulfillment.name,
                this,
                fulfillment.goalExecutor,
                {
                    pushTest: fulfillment.pushTest || AnyPush,
                    progressReporter: fulfillment.progressReporter,
                    logInterpreter: fulfillment.logInterpreter,
                });
        } else if (isSideEffect(fulfillment)) {
            this.sdm.addGoalSideEffect(this, fulfillment.name, fulfillment.pushTest);
        }
    }
}

/**
 * Goal that accepts registrations of T.
 */
export abstract class FulfillableGoalWithRegistrations<T> extends FulfillableGoal {

    protected registrations: T[] = [];

    constructor(public definition: GoalDefinition,
                protected sdm: SoftwareDeliveryMachine = sdmInstance()) {
        super(definition);
    }

    public with(registration: T): this {
        this.registrations.push(registration);
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
