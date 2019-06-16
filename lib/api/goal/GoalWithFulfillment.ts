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

import {
    configurationValue,
    RetryOptions,
} from "@atomist/automation-client";
import * as _ from "lodash";
import { LogSuppressor } from "../../api-helper/log/logInterpreters";
import { AbstractSoftwareDeliveryMachine } from "../../api-helper/machine/AbstractSoftwareDeliveryMachine";
import { InterpretLog } from "../../spi/log/InterpretedLog";
import { GoalExecutionListener } from "../listener/GoalStatusListener";
import {
    Registerable,
    registerRegistrable,
} from "../machine/Registerable";
import { SoftwareDeliveryMachine } from "../machine/SoftwareDeliveryMachine";
import { PushTest } from "../mapping/PushTest";
import { AnyPush } from "../mapping/support/commonPushTests";
import {
    ServiceRegistration,
    ServiceRegistrationGoalDataKey,
} from "../registration/ServiceRegistration";
import {
    createPredicatedGoalExecutor,
    createRetryingGoalExecutor,
    WaitRules,
} from "./common/createGoal";
import {
    Goal,
    GoalDefinition,
    GoalWithPrecondition,
    isGoalDefinition,
} from "./Goal";
import {
    ExecuteGoal,
    GoalProjectListenerRegistration,
} from "./GoalInvocation";
import { DefaultGoalNameGenerator } from "./GoalNameGenerator";
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

    preCondition?: WaitRules;
    retryCondition?: RetryOptions;
}

/**
 * Extension to GoalDefinition that allows to specify additional WaitRules.
 */
export interface PredicatedGoalDefinition extends GoalDefinition {

    preCondition?: WaitRules;
    retryCondition?: RetryOptions;
}

/**
 * Goal that registers goal implementations, side effects and callbacks on the
 * current SDM. No additional registration with the SDM is needed.
 */
export abstract class FulfillableGoal extends GoalWithPrecondition implements Registerable {

    public readonly fulfillments: Fulfillment[] = [];
    public readonly callbacks: GoalFulfillmentCallback[] = [];
    public readonly projectListeners: GoalProjectListenerRegistration[] = [];
    public readonly goalListeners: GoalExecutionListener[] = [];

    public sdm: SoftwareDeliveryMachine;

    constructor(public definitionOrGoal: PredicatedGoalDefinition | Goal, ...dependsOn: Goal[]) {
        super(isGoalDefinition(definitionOrGoal) ? definitionOrGoal : definitionOrGoal.definition, ...dependsOn);
        registerRegistrable(this);
    }

    public register(sdm: SoftwareDeliveryMachine): void {
        this.sdm = sdm;
        this.fulfillments.forEach(f => this.registerFulfillment(f));
        this.callbacks.forEach(cb => this.registerCallback(cb));
        this.goalListeners.forEach(gl => sdm.addGoalExecutionListener(gl));
    }

    public withProjectListener(listener: GoalProjectListenerRegistration): this {
        this.projectListeners.push(listener);
        return this;
    }

    public withExecutionListener(listener: GoalExecutionListener): this {
        const wrappedListener = async gi => {
            if (gi.goalEvent.uniqueName === this.uniqueName) {
                return listener(gi);
            }
        };
        if (this.sdm) {
            this.sdm.addGoalExecutionListener(wrappedListener);
        }
        this.goalListeners.push(wrappedListener);
        return this;
    }

    public withService(registration: ServiceRegistration<any>): this {
        this.addFulfillmentCallback({
            goal: this,
            callback: async (goalEvent, repoContext) => {
                const service = await registration.service(goalEvent, repoContext);
                if (!!service) {
                    const data = JSON.parse(goalEvent.data || "{}");
                    const servicesData = {};
                    _.set<any>(servicesData, `${ServiceRegistrationGoalDataKey}.${registration.name}`, service);
                    goalEvent.data = JSON.stringify(_.merge(data, servicesData));
                }
                return goalEvent;
            },
        });
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
            if (isGoalDefinition(this.definitionOrGoal) && !!this.definitionOrGoal.preCondition) {
                goalExecutor = createPredicatedGoalExecutor(
                    this.definitionOrGoal.uniqueName,
                    goalExecutor,
                    this.definitionOrGoal.preCondition);
            }
            if (isGoalDefinition(this.definitionOrGoal) && !!this.definitionOrGoal.retryCondition) {
                goalExecutor = createRetryingGoalExecutor(
                    this.definitionOrGoal.uniqueName,
                    goalExecutor,
                    this.definitionOrGoal.retryCondition);
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

    public readonly registrations: R[] = [];

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

    public readonly listeners: L[] = [];

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

/**
 * Creates a new GoalWithFulfillment instance using conventions if overwrites aren't provided
 *
 * Call this from your machine.ts where you configure your sdm to create a custom goal.
 *
 * Caution: if you wrap this in another function, then you MUST provide details.uniqueName,
 *          because the default is based on where in the code this `goal` function is called.
 *
 * @param details It is highly recommended that you supply at least uniqueName.
 * @param goalExecutor
 * @param options
 */
export function goal(details: FulfillableGoalDetails = {},
                     goalExecutor?: ExecuteGoal,
                     options?: {
        pushTest?: PushTest,
        logInterpreter?: InterpretLog,
        progressReporter?: ReportProgress,
    }): GoalWithFulfillment {
    const def = getGoalDefinitionFrom(details, DefaultGoalNameGenerator.generateName(details.displayName || "goal"));
    const g = new GoalWithFulfillment(def);
    if (!!goalExecutor) {
        const optsToUse = {
            pushTest: AnyPush,
            logInterpreter: LogSuppressor,
            ...(!!options ? options : {}),
        };
        g.with({
            name: def.uniqueName,
            goalExecutor,
            ...optsToUse,
        });
    }
    return g;
}

/**
 * Construct a PredicatedGoalDefinition from the provided goalDetails
 * @param goalDetails
 * @param uniqueName
 * @param definition
 */
// tslint:disable:cyclomatic-complexity
export function getGoalDefinitionFrom(goalDetails: FulfillableGoalDetails | string,
                                      uniqueName: string,
                                      definition?: GoalDefinition): { uniqueName: string } | PredicatedGoalDefinition {
    if (typeof goalDetails === "string") {
        return {
            ...(definition || {}),
            uniqueName: goalDetails || uniqueName,
        };
    } else {
        const defaultDefinition: Partial<GoalDefinition> = {
            ...(definition || {}),
        };
        if (goalDetails.descriptions) {
            defaultDefinition.canceledDescription = goalDetails.descriptions.canceled || defaultDefinition.canceledDescription;
            defaultDefinition.completedDescription = goalDetails.descriptions.completed || defaultDefinition.completedDescription;
            defaultDefinition.failedDescription = goalDetails.descriptions.failed || defaultDefinition.failedDescription;
            defaultDefinition.plannedDescription = goalDetails.descriptions.planned || defaultDefinition.plannedDescription;
            defaultDefinition.requestedDescription = goalDetails.descriptions.requested || defaultDefinition.requestedDescription;
            defaultDefinition.stoppedDescription = goalDetails.descriptions.stopped || defaultDefinition.stoppedDescription;
            defaultDefinition.waitingForApprovalDescription =
                goalDetails.descriptions.waitingForApproval || defaultDefinition.waitingForApprovalDescription;
            defaultDefinition.waitingForPreApprovalDescription =
                goalDetails.descriptions.waitingForPreApproval || defaultDefinition.waitingForPreApprovalDescription;
            defaultDefinition.workingDescription = goalDetails.descriptions.inProcess || defaultDefinition.workingDescription;
        }
        return {
            ...defaultDefinition,
            displayName: goalDetails.displayName || defaultDefinition.displayName,
            uniqueName: goalDetails.uniqueName || uniqueName,
            environment: getEnvironment(goalDetails),
            approvalRequired: goalDetails.approval || defaultDefinition.approvalRequired,
            preApprovalRequired: goalDetails.preApproval || defaultDefinition.preApprovalRequired,
            retryFeasible: goalDetails.retry || defaultDefinition.retryFeasible,
            isolated: goalDetails.isolate || defaultDefinition.isolated,
            preCondition: goalDetails.preCondition,
        };
    }
}

/**
 * Merge Goal configuration options into a final options object.
 * Starts off by merging the explicitly provided options over the provided defaults; finally merges the configuration
 * values at the given configuration path (prefixed with sdm.) over the previous merge.
 * @param defaults
 * @param explicit
 * @param configurationPath
 */
export function mergeOptions<OPTIONS>(defaults: OPTIONS, explicit: OPTIONS, configurationPath?: string): OPTIONS {
    const options: OPTIONS = _.merge(_.cloneDeep(defaults), explicit || {});
    if (!!configurationPath) {
        const configurationOptions = configurationValue<OPTIONS>(`sdm.${configurationPath}`, {} as any);
        return _.merge(options, configurationOptions);
    }
    return options;
}

function getEnvironment(details?: { environment?: string | GoalEnvironment }): GoalEnvironment {
    if (details && details.environment && typeof details.environment === "string") {
        switch (details.environment) {
            case "testing":
                return StagingEnvironment;
            case "production":
                return ProductionEnvironment;
            default:
                return IndependentOfEnvironment;
        }
    } else if (details && typeof details.environment !== "string") {
        return details.environment;
    } else {
        return IndependentOfEnvironment;
    }
}
