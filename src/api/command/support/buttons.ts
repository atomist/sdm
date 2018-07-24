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

import { buttonForCommand, ButtonSpecification } from "@atomist/automation-client/spi/message/MessageClient";
import { Action } from "@atomist/slack-messages";
import { CommandHandlerRegistration } from "../../..";

/**
 * Create an actionable button invoking the given command
 * @param {ButtonSpecification} buttonSpec
 * @param {CommandHandlerRegistration<T>} commandHandlerRegistration command registration
 * @param {T} parameters parameters to the command
 * @return {Action}
 */
export function actionableButton<T>(
    buttonSpec: ButtonSpecification,
    commandHandlerRegistration: CommandHandlerRegistration<T>,
    parameters?: Partial<T>): Action {
    return buttonForCommand(buttonSpec,
        commandHandlerRegistration.name,
        toFlattenedProperties(parameters));
}

export interface ParamsSpec {
    [name: string]: string | number | boolean;
}

/**
 * Convert nested properties to flattened property paths.
 * E.g. convert targets.owner to a top-level property named "targets.owner"
 * @param o
 * @return {ParamsSpec}
 */
export function toFlattenedProperties(o: any): ParamsSpec {
    const result = {};
    addPropertiesFrom("", o, result);
    return result;
}

function addPropertiesFrom(prefix: string, o: any, output: ParamsSpec) {
    if (!o) {
        return;
    }
    for (const propName of Object.getOwnPropertyNames(o)) {
        const val = o[propName];
        const outputPropName = !!prefix ? (prefix + "." + propName) : propName;
        if (typeof val === "object") {
            addPropertiesFrom(outputPropName, val, output);
        } else {
            output[outputPropName] = val;
        }
    }
}
