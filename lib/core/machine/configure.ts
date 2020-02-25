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

import {
    Configuration,
    ConfigurationPostProcessor,
} from "@atomist/automation-client/lib/configuration";
import { logger } from "@atomist/automation-client/lib/util/logger";
import * as _ from "lodash";
import { SdmContext } from "../../api/context/SdmContext";
import { GoalContribution } from "../../api/dsl/goalContribution";
import { whenPushSatisfies } from "../../api/dsl/goalDsl";
import { Goal } from "../../api/goal/Goal";
import {
    goals,
    Goals,
} from "../../api/goal/Goals";
import { GoalWithFulfillment } from "../../api/goal/GoalWithFulfillment";
import { PushListenerInvocation } from "../../api/listener/PushListener";
import { SoftwareDeliveryMachine } from "../../api/machine/SoftwareDeliveryMachine";
import { notGoalOrOutputTest } from "../../api/mapping/goalTest";
import { PushTest } from "../../api/mapping/PushTest";
import { AnyPush } from "../../api/mapping/support/commonPushTests";
import { allSatisfied } from "../../api/mapping/support/pushTestUtils";
import {
    ConfigureOptions,
    configureSdm,
} from "./configureSdm";
import { LocalSoftwareDeliveryMachineConfiguration } from "./LocalSoftwareDeliveryMachineOptions";
import { toArray } from "../util/misc/array";
import { createSoftwareDeliveryMachine } from "./machineFactory";

/**
 * Data structure to configure goal contributions
 */
export interface GoalStructure {

    /**
     * Optional push tests to determine when to schedule provided goals
     *
     * If an array of push tests is provided, they will get wrapped with allSatisfied/and.
     */
    test?: PushTest | PushTest[];

    /** Optional pre conditions for goals; can be actual goal instances or names of goal contributions */
    dependsOn?: string | Goal | Array<string | Goal>;

    /**
     * Goal instances to schedule
     *
     * The following cases are supported:
     *
     * goals: [
     *  autofix,
     *  build
     * ]
     *
     * This means autofix will run after build
     *
     * goals: [
     *  [autofix, build]
     * ]
     *
     * This will schedule autofix and build concurrently
     *
     * goals: [
     *  [autofix, build],
     *  dockerBuild
     * ]
     *
     * This will schedule autofix and build concurrently and dockerBuild once autofix and build are completed
     */
    goals: Goal | Goals | Array<Goal | Goals | Array<Goal | Goals>>;
}

/**
 * Type to collect named GoalStructure instances
 *
 * The record key will be used to name the goal contribution.
 */
export type GoalData = Record<string, GoalStructure>;

/**
 * Type to collect goal instances for this SDM
 */
export type DeliveryGoals = Record<string, Goal | GoalWithFulfillment>;

/**
 * @deprecated use DeliveryGoals
 */
export type AllGoals = DeliveryGoals;

/**
 * Type to create goal instances for this SDM
 */
export type GoalCreator<G extends DeliveryGoals> = (sdm: SoftwareDeliveryMachine) => Promise<G>;

/**
 * Type to configure provided goals with fulfillments, listeners etc
 */
export type GoalConfigurer<G extends DeliveryGoals> = (sdm: SoftwareDeliveryMachine, goals: G) => Promise<void>;

/**
 * Type to orchestrate the creation and configuration of goal instances for this SDM
 */
export type CreateGoals<G extends DeliveryGoals> = (creator: GoalCreator<G>,
                                                    configurers?: GoalConfigurer<G> | Array<GoalConfigurer<G>>) => Promise<G>;

/**
 * Configure a SoftwareDeliveryMachine instance by adding command, events etc and optionally returning
 * GoalData, an array of GoalContributions or void when no goals should be added to this SDM.
 */
export type Configurer<G extends DeliveryGoals, F extends SdmContext = PushListenerInvocation> =
    (sdm: SoftwareDeliveryMachine & { createGoals: CreateGoals<G> }) => Promise<void | GoalData | Array<GoalContribution<F>>>;

/**
 *  Process the configuration before creating the SDM instance
 */
export type ConfigurationPreProcessor = (cfg: LocalSoftwareDeliveryMachineConfiguration) =>
    Promise<LocalSoftwareDeliveryMachineConfiguration>;

export interface ConfigureMachineOptions extends ConfigureOptions {
    /**
     * SDM name if you want to override the default which uses the
     * package name.
     */
    name?: string;
    /**
     * These functions are called in the first postProcessor.
     * Specifically, the first post-processor is [[configureSdm]]
     * these functions are called in its
     * [[SoftwareDeliveryMachineMaker]] function prior to it calling
     * the [[createSoftwareDeliveryMachine]].
     */
    preProcessors?: ConfigurationPreProcessor | ConfigurationPreProcessor[];
    /**
     * These functions are called after the [[configureSdm]] post-processor.
     */
    postProcessors?: ConfigurationPostProcessor | ConfigurationPostProcessor[];
}

/**
 * Function to create an SDM configuration constant to be exported from an index.ts/js.
 */
export function configure<G extends DeliveryGoals, T extends SdmContext = PushListenerInvocation>(
    configurer: Configurer<G, T>,
    options: ConfigureMachineOptions = {}): Configuration {
    return {
        postProcessors: [
            configureSdm(async cfg => {
                let cfgToUse = cfg;

                // Modify the configuration before creating the SDM instance
                if (!!options.preProcessors) {
                    for (const preProcessor of toArray(options.preProcessors)) {
                        cfgToUse = await preProcessor(cfgToUse);
                    }
                }

                const sdm = createSoftwareDeliveryMachine(
                    {
                        name: options.name || cfgToUse.name,
                        configuration: cfgToUse,
                    });

                const configured = await invokeConfigurer(sdm, configurer);

                if (Array.isArray(configured)) {
                    sdm.withPushRules(configured[0], ...configured.slice(1));
                } else if (!!configured) {
                    const goalContributions = convertGoalData(configured);
                    if (goalContributions.length > 0) {
                        sdm.withPushRules(goalContributions[0], ...(goalContributions.slice(1) || []));
                    }
                }

                return sdm;
            }, options),
            ...(toArray(options.postProcessors || [])),
        ],
    };
}

/**
 * Convert the provided GoalData instance into an array of GoalContributions
 */
export function convertGoalData(goalData: GoalData): Array<GoalContribution<any>> {
    const goalContributions: Array<GoalContribution<any>> = [];

    _.forEach(goalData, (v, k) => {
        (v as any).__goals = [];

        const gs = goals(k.replace(/_/g, " "));
        let lg: Array<Goal | Goals>;

        if (!!v.dependsOn) {
            lg = [];
            toArray(v.dependsOn).forEach(d => {
                if (typeof d === "string") {
                    if (!!goalData[d] && !!(goalData[d] as any).__goals) {
                        lg.push(...(goalData[d] as any).__goals);
                    } else {
                        throw new Error(
                            `Provided dependsOn goals with name '${d}' do not exist or is after current goals named '${k}'`);
                    }
                } else {
                    lg.push(...toArray(d));
                }
            });
        }

        toArray(v.goals || []).forEach(g => {
            (v as any).__goals.push(...(Array.isArray(g) ? (g) : [g]));
            if (!!lg) {
                gs.plan(...convertGoals(g)).after(...convertGoals(lg));
            } else {
                gs.plan(...convertGoals(g));
            }
            lg = toArray(g);
        });

        goalContributions.push(whenPushSatisfies(convertPushTest(v.test)).setGoals(gs));
    });

    return goalContributions;
}

/**
 * Invoke the given configurer
 */
export async function invokeConfigurer(sdm: SoftwareDeliveryMachine,
                                       configurer: Configurer<any, any>): Promise<void | GoalData | Array<GoalContribution<any>>> {

    try {
        // Decorate the createGoals method onto the SDM
        (sdm as any).createGoals = async (creator: GoalCreator<any>,
                                          configurers: GoalConfigurer<any> | Array<GoalConfigurer<any>>) => {

            let gc;
            try {
                gc = await creator(sdm);
            } catch (e) {
                e.message = `Creating goals failed: ${e.message}`;
                logger.error(e.message);
                throw e;
            }

            try {
                if (!!configurers) {
                    for (const c of toArray(configurers)) {
                        await c(sdm, gc);
                    }
                }
            } catch (e) {
                e.message = `Configuring goals failed: ${e.message}`;
                logger.error(e.message);
                throw e;
            }
            return gc;
        };

        return await configurer(sdm as any);
    } finally {
        delete (sdm as any).createGoals;
    }
}

function convertPushTest(test: PushTest | PushTest[]): PushTest {
    if (Array.isArray(test)) {
        const goalPushTests = test.filter(t => !!(t as any).pushTest);
        const convertedPushTest = allSatisfied(...test.map(wrapTest));
        if (goalPushTests.length > 0) {
            (convertedPushTest as any).pushTest = allSatisfied(...goalPushTests.map(t => (t as any).pushTest));
        }
        return convertedPushTest;
    } else {
        return wrapTest(test || AnyPush);
    }
}

function wrapTest(test: PushTest): PushTest {
    if (!!(test as any).pushTest) {
        return test;
    } else {
        return notGoalOrOutputTest(test);
    }
}

function convertGoals(gs: Goal | Goals | Array<Goal | Goals>): Array<Goal | Goals> {
    if (Array.isArray(gs)) {
        return gs;
    } else {
        return [gs];
    }
}
