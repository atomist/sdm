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
    mergeParameters,
} from "@atomist/automation-client/lib/spi/message/MessageClient";
import { Action } from "@atomist/slack-messages";
import { CommandRegistration } from "../../registration/CommandRegistration";

/**
 * Create an actionable button invoking the given command
 * @param {ButtonSpecification} buttonSpec
 * @param {CommandHandlerRegistration<T>} commandHandlerRegistration command registration
 * @param {T} parameters parameters to the command
 * @return {Action}
 */
export function actionableButton<T>(
    buttonSpec: ButtonSpecification,
    commandHandlerRegistration: CommandRegistration<T>,
    parameters?: Partial<T>): Action {
    return buttonForCommand(buttonSpec,
        commandHandlerRegistration.name,
        mergeParameters(parameters, {}));
}
