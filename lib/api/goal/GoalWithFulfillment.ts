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

import { AbstractSoftwareDeliveryMachine } from "../../api-helper/machine/AbstractSoftwareDeliveryMachine";
import { InterpretLog } from "../../spi/log/InterpretedLog";
import {
    Registerable,
    registerRegistrable,
} from "../machine/Registerable";
import { SoftwareDeliveryMachine } from "../machine/SoftwareDeliveryMachine";
import { PushTest } from "../mapping/PushTest";
import { AnyPush } from "../mapping/support/commonPushTests";
import {
    createPredicatedGoalExecutor,
    WaitRules,
} from "./common/createGoal";
import {
    Goal,
    GoalDefinition,
    GoalWithPrecondition,
    isGoalDefiniton,
} from "./Goal";
import {
    ExecuteGoal,
    GoalProjectListenerRegistration,
} from "./GoalInvocation";
import { ReportProgress } from "./progress/ReportProgress";
import {
    GoalEnvironment,
    IndependentOfEnvironment,
    ProductionEnvironment,
    StagingEnvironment,
} from "./support/environment";
import { GoalFulfillmentCallback } from "./support/GoalImplementationMapper";

export type Fulfillment = Implementation | SideEffect;

/**
 * Register a fulfillment with basic details
 */
export interface FulfillmentRegistration {

    /**
     * Name of goal implementation
     */
    name: string;

    /**
     * Optional push test to identify the types of projects and pushes this implementation
     * should get invoked on when the goal gets scheduled
     */
    pushTest?: PushTest;
}

/**
 * Register a goal implementation with required details
 */
export interface ImplementationRegistration extends FulfillmentRegistration {

    /**
     * Optional log interpreter for this goal implementations log output
     */
    logInterpreter?: InterpretLog;

    /**
     * Optional progress reporter for this goal implementation
     */
    progressReporter?: ReportProgress;
}

export interface Implementation extends ImplementationRegistration {
    goalExecutor: ExecuteGoal;
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
 * Subset of the GoalDefinition interface to use by typed Goals to allow
 * specifying some aspect of the Goal that are specific to the current use case.
 */
export interface FulfillableGoalDetails {
    displayName?: string;
    uniqueName?: string;
    environment?: string | GoalEnvironment;
    approval?: boolean;
    preApproval?: boolean;
    retry?: boolean;
    isolate?: boolean;

    descriptions?: {
        planned?: string;
        requested?: string;
        completed?: string;
        inProcess?: string;
        failed?: string;
        waitingForApproval?: string;
        waitingForPreApproval?: string;
        canceled?: string;
        stopped?: string;
    };

    waitRules?: WaitRules;
}

/**
 * Extension to GoalDefinition that allows to specify additional WaitRules.
 */
export interface PredicatedGoalDefinition extends GoalDefinition {

    waitRules?: WaitRules;
}

/**
 * Goal that registers goal implementations, side effects and callbacks on the
 * current SDM. No additional registration with the SDM is needed.
 */
export abstract class FulfillableGoal extends GoalWithPrecondition implements Registerable {

    protected readonly fulfillments: Fulfillment[] = [];
    protected readonly callbacks: GoalFulfillmentCallback[] = [];
    protected readonly projectListeners: GoalProjectListenerRegistration[] = [];

    public sdm: SoftwareDeliveryMachine;

    constructor(public definitionOrGoal: PredicatedGoalDefinition | Goal, ...dependsOn: Goal[]) {
        super(isGoalDefiniton(definitionOrGoal) ? definitionOrGoal : definitionOrGoal.definition, ...dependsOn);
        registerRegistrable(this);
    }

    public register(sdm: SoftwareDeliveryMachine): void {
        this.sdm = sdm;
        this.fulfillments.forEach(fulfillment => {
            this.registerFulfillment(fulfillment);
        });
        this.callbacks.forEach(cb => this.registerCallback(cb));
    }

    public withProjectListener(listener: GoalProjectListenerRegistration): this {
        this.projectListeners.push(listener);
        return this;
    }

    protected addFulfillmentCallback(cb: GoalFulfillmentCallback): this {
        if (this.sdm) {
            this.registerCallback(cb);
        }
        this.callbacks.push(cb);
        return this;
    }

    protected addFulfillment(fulfillment: Fulfillment): this {
        if (this.sdm) {
            this.registerFulfillment(fulfillment);
        }
        this.fulfillments.push(fulfillment);
        return this;
    }

    private registerFulfillment(fulfillment: Fulfillment): void {
        if (isImplementation(fulfillment)) {
            let goalExecutor = fulfillment.goalExecutor;

            // Wrap the ExecuteGoal instance with WaitRules if provided
            if (isGoalDefiniton(this.definitionOrGoal) && this.definitionOrGoal.waitRules) {
                goalExecutor = createPredicatedGoalExecutor(
                    this.definitionOrGoal.uniqueName,
                    goalExecutor,
                    this.definitionOrGoal.waitRules);
            }

            (this.sdm as AbstractSoftwareDeliveryMachine).addGoalImplementation(
                fulfillment.name,
                this,
                goalExecutor,
                {
                    pushTest: fulfillment.pushTest || AnyPush,
                    progressReporter: fulfillment.progressReporter,
                    logInterpreter: fulfillment.logInterpreter,
                    projectListeners: this.projectListeners,
                });
        } else if (isSideEffect(fulfillment)) {
            (this.sdm as AbstractSoftwareDeliveryMachine).addGoalSideEffect(
                this,
                fulfillment.name,
                fulfillment.pushTest);
        }
    }

    private registerCallback(cb: GoalFulfillmentCallback): void {
        this.sdm.goalFulfillmentMapper.addFulfillmentCallback(cb);
    }
}

/**
 * Goal that accepts registrations of R.
 */
export abstract class FulfillableGoalWithRegistrations<R> extends FulfillableGoal {

    protected registrations: R[] = [];

    constructor(public definitionOrGoal: PredicatedGoalDefinition | Goal, ...dependsOn: Goal[]) {
        super(definitionOrGoal, ...dependsOn);
    }

    public with(registration: R): this {
        this.registrations.push(registration);
        return this;
    }
}

/**
 * Goal that accepts registrations of R and listeners of L.
 */
export abstract class FulfillableGoalWithRegistrationsAndListeners<R, L> extends FulfillableGoalWithRegistrations<R> {

    protected listeners: L[] = [];

    constructor(public definitionOrGoal: PredicatedGoalDefinition | Goal, ...dependsOn: Goal[]) {
        super(definitionOrGoal, ...dependsOn);
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

export function getGoalDefinitionFrom(goalDetails: FulfillableGoalDetails | string,
                                      uniqueName: string): { uniqueName: string } | PredicatedGoalDefinition {
    if (typeof goalDetails === "string") {
        return {
            uniqueName : goalDetails || uniqueName,
        };
    } else {
        const descriptions: Partial<GoalDefinition> = {};
        if (goalDetails.descriptions) {
            descriptions.canceledDescription = goalDetails.descriptions.canceled;
            descriptions.completedDescription = goalDetails.descriptions.completed;
            descriptions.failedDescription = goalDetails.descriptions.failed;
            descriptions.plannedDescription = goalDetails.descriptions.planned;
            descriptions.requestedDescription = goalDetails.descriptions.requested;
            descriptions.stoppedDescription = goalDetails.descriptions.stopped;
            descriptions.waitingForApprovalDescription = goalDetails.descriptions.waitingForApproval;
            descriptions.waitingForPreApprovalDescription = goalDetails.descriptions.waitingForPreApproval;
            descriptions.workingDescription = goalDetails.descriptions.inProcess;
        }
        return {
            displayName: goalDetails.displayName,
            uniqueName: goalDetails.uniqueName || uniqueName,
            environment: getEnvironment(goalDetails),
            approvalRequired: goalDetails.approval,
            preApprovalRequired: goalDetails.preApproval,
            retryFeasible: goalDetails.retry,
            isolated: goalDetails.isolate,
            waitRules: goalDetails.waitRules,
            ...descriptions,
        };
    }
}

function getEnvironment(details?: { environment?: string }): GoalEnvironment {
    if (details && details.environment && typeof details.environment === "string") {
        switch (details.environment) {
            case "testing":
                return StagingEnvironment;
            case "production":
                return ProductionEnvironment;
            default:
                return IndependentOfEnvironment;
        }
    } else {
        return IndependentOfEnvironment;
    }
}
