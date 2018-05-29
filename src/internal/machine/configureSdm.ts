import { Configuration } from "@atomist/automation-client";
import { guid } from "@atomist/automation-client/internal/util/string";
import * as _ from "lodash";
import { SoftwareDeliveryMachine } from "../../api/machine/SoftwareDeliveryMachine";
import { GoalAutomationEventListener } from "../../handlers/events/delivery/goals/launchGoal";
import { ConcreteSoftwareDeliveryMachineOptions } from "../../machine/ConcreteSoftwareDeliveryMachineOptions";
import { softwareDeliveryMachineOptions } from "../../machine/sdmOptions";

export interface ConfigureOptions {
    sdmOptions?: Partial<ConcreteSoftwareDeliveryMachineOptions>;
    requiredConfigurationValues?: string[];
}

export function configureSdm(
    machineMaker: (options: ConcreteSoftwareDeliveryMachineOptions, configuration: Configuration) => SoftwareDeliveryMachine,
    options: ConfigureOptions = {}) {
    return async (config: Configuration) => {
        const sdmOptions = {
            ...softwareDeliveryMachineOptions(config),
            ...(options.sdmOptions ? options.sdmOptions : {}),
        };
        const machine = machineMaker(sdmOptions, config);

        const forked = process.env.ATOMIST_ISOLATED_GOAL === "true";
        if (forked) {
            config.listeners.push(
                new GoalAutomationEventListener(
                    machine.goalFulfillmentMapper,
                    machine.options.projectLoader,
                    machine.options.repoRefResolver,
                    machine.options.logFactory));
            config.name = `${config.name}-${process.env.ATOMIST_GOAL_ID || guid()}`;
            // force ephemeral policy and no handlers or ingesters
            config.policy = "ephemeral";
            config.commands = [];
            config.events = [];
            config.ingesters = [];

            // Disable app events for forked clients
            config.applicationEvents.enabled = false;
        } else {
            const missingValues = [];
            (options.requiredConfigurationValues || []).forEach(v => {
                if (!_.get(config, v)) {
                    missingValues.push(v);
                }
            });
            if (missingValues.length > 0) {
                throw new Error(
                    `Missing configuration values. Please add the following values to your client configuration: '${missingValues.join(", ")}'`);
            }

            if (!config.commands) {
                config.commands = [];
            }
            config.commands.push(...machine.commandHandlers);

            if (!config.events) {
                config.events = [];
            }
            config.events.push(...machine.eventHandlers);
        }
        return config;
    };
}
