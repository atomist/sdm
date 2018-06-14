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

import { Configuration } from "@atomist/automation-client";
import { guid } from "@atomist/automation-client/internal/util/string";
import * as _ from "lodash";
import { SoftwareDeliveryMachine } from "../../api/machine/SoftwareDeliveryMachine";
import {
    SoftwareDeliveryMachineConfiguration,
} from "../../api/machine/SoftwareDeliveryMachineOptions";
import { GoalAutomationEventListener } from "../../handlers/events/delivery/goals/launchGoal";
import { defaultSoftwareDeliveryMachineOptions } from "../../machine/defaultSoftwareDeliveryMachineOptions";

/**
 * Options that are used during configuration of an SDM but don't get passed on to the
 * running SDM instance
 */
export interface ConfigureOptions {
    requiredConfigurationValues?: string[];
}

/**
 * Type that can create a fully configured SDM
 */
export type SoftwareDeliveryMachineMaker = (configuration: SoftwareDeliveryMachineConfiguration) => SoftwareDeliveryMachine;

/**
 * Configure and set up a Software Deliver Machince instance with the automation-client framework for standalone
 * or single goal based execution
 * @param {(configuration: (Configuration & SoftwareDeliveryMachineOptions)) => SoftwareDeliveryMachine} machineMaker
 * @param {ConfigureOptions} options
 * @returns {(config: Configuration) => Promise<Configuration & SoftwareDeliveryMachineOptions>}
 */
export function configureSdm(
    machineMaker: SoftwareDeliveryMachineMaker,
    options: ConfigureOptions = {}) {

    return async (config: Configuration) => {
        const defaultSdmOptions = defaultSoftwareDeliveryMachineOptions(config);
        const mergedConfig = _.merge(defaultSdmOptions, config) as SoftwareDeliveryMachineConfiguration;
        const machine = machineMaker(mergedConfig);

        const forked = process.env.ATOMIST_ISOLATED_GOAL === "true";
        if (forked) {
            if (process.env.ATOMIST_JOB_NAME) {
                mergedConfig.name = process.env.ATOMIST_REGISTRATION_NAME;
            } else {
                mergedConfig.name = `${mergedConfig.name}-${process.env.ATOMIST_GOAL_ID || guid()}`;
            }

            // Force ephemeral policy and no handlers or ingesters
            mergedConfig.policy = "ephemeral";
            mergedConfig.commands = [];
            mergedConfig.events = [];
            mergedConfig.ingesters = [];

            mergedConfig.listeners.push(
                new GoalAutomationEventListener(
                    machine.goalFulfillmentMapper,
                    machine.configuration.sdm.projectLoader,
                    machine.configuration.sdm.repoRefResolver,
                    machine.configuration.sdm.credentialsResolver,
                    machine.configuration.sdm.logFactory));

            // Disable app events for forked clients
            mergedConfig.applicationEvents.enabled = false;
        } else {
            validateConfiguration(mergedConfig, options);

            if (!mergedConfig.commands) {
                mergedConfig.commands = [];
            }
            mergedConfig.commands.push(...machine.commandHandlers);

            if (!mergedConfig.events) {
                mergedConfig.events = [];
            }
            mergedConfig.events.push(...machine.eventHandlers);
        }
        return mergedConfig;
    };
}

function validateConfiguration(config: Configuration, options: ConfigureOptions) {
    const missingValues = [];
    (options.requiredConfigurationValues || []).forEach(v => {
        if (!_.get(config, v)) {
            missingValues.push(v);
        }
    });
    if (missingValues.length > 0) {
        throw new Error(
            `Missing configuration values. Please add the following values to your client configuration: '${
                missingValues.join(", ")}'`);
    }
}
