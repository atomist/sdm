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
    Maker,
    RepoFinder,
    RepoLoader,
} from "@atomist/automation-client";
import { SoftwareDeliveryMachineConfiguration } from "../machine/SoftwareDeliveryMachineOptions";
import { ParametersDefinition } from "./ParametersDefinition";

/**
 * Different strategies to ask for parameters in chat or web
 */
export enum ParameterStyle {

    /** Parameter questions will be prompted in a dialog */
    Dialog = "dialog",

    /** Parameter questions will be prompted in a thread */
    Threaded = "threaded",

    /**
     * Parameter questions will be prompted in the channel where the
     * command is being run
     */
    Unthreaded = "unthreaded",

    /**
     * Parameter questions will be prompted in a dialog if the command
     * is triggered from a button or menu
     */
    DialogAction = "dialog_action",
}

/**
 * Common supertype for all command registrations.
 */
export interface CommandRegistration<PARAMS> {

    /** Name of the command */
    name: string;

    /** Description of the command */
    description?: string;

    /**
     * Function to create a parameters object used by this command.
     * Empty parameters will be returned by default.
     * @deprecated use parameters
     */
    paramsMaker?: Maker<PARAMS>;

    /**
     * Define parameters used by this command. Alternative to using
     * paramsMaker: Do not supply both.
     */
    parameters?: ParametersDefinition<PARAMS>;

    /**
     * Intent or list of intents. What you need to type to invoke the
     * command, for example via the bot.
     */
    intent?: string | string[] | RegExp;

    /**
     * Tags associated with this command. Useful in searching.
     */
    tags?: string | string[];

    /**
     * Configure command to submit without confirmation
     */
    autoSubmit?: boolean;

    /**
     * Configure strategy on how to prompt for parameters in chat or web
     */
    parameterStyle?: ParameterStyle;

    repoFinder?: RepoFinder;

    repoLoader?: (p: PARAMS) => RepoLoader;

    /**
     * If provided, select when this command is registered.
     * Enables conditional registration on SDM startup, based on
     * configuration, environment variables etc.
     * This method is invoked during SDM startup.
     * @param {SoftwareDeliveryMachineConfiguration} sdmConfiguration
     * @return {boolean}
     */
    registerWhen?: (sdmConfiguration: SoftwareDeliveryMachineConfiguration) => boolean;

}
