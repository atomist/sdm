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

import {
    buttonForCommand,
    ButtonSpecification,
    menuForCommand,
    MenuSpecification,
    mergeParameters,
    ParameterType,
} from "@atomist/automation-client";
import { Action } from "@atomist/slack-messages";
import { CommandRegistration } from "../../registration/CommandRegistration";

/**
 * Create an actionable button invoking the given command
 * @param buttonSpec
 * @param commandHandlerRegistration command registration or command name
 * @param parameters parameters to the command
 * @return
 */
export function actionableButton<T extends ParameterType>(
    buttonSpec: ButtonSpecification,
    commandHandlerRegistration: CommandRegistration<T> | string,
    parameters?: ParameterType): Action {
    const name = typeof commandHandlerRegistration === "string" ?
        commandHandlerRegistration : commandHandlerRegistration.name;
    return buttonForCommand(buttonSpec,
        name,
        mergeParameters(parameters, {}));
}

/**
 * Create an actionable menu invoking the given command
 * @param menuSpec
 * @param commandHandlerRegistration command registration or command name
 * @param parameterName name of the parameter to bind the menu to
 * @param parameters parameters to the command
 */
export function actionableMenu<T extends ParameterType>(
    menuSpec: MenuSpecification,
    commandHandlerRegistration: CommandRegistration<T> | string,
    parameterName: string,
    parameters?: ParameterType): Action {
    const name = typeof commandHandlerRegistration === "string" ?
        commandHandlerRegistration : commandHandlerRegistration.name;
    return menuForCommand(menuSpec,
        name,
        parameterName,
        mergeParameters(parameters, {}));
}
