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

import { automationClientInstance } from "@atomist/automation-client/lib/globals";
import {
    AutomationContextAware,
    HandlerContext,
} from "@atomist/automation-client/lib/HandlerContext";
import { HandlerResult } from "@atomist/automation-client/lib/HandlerResult";
import { ParameterType } from "@atomist/automation-client/lib/SmartParameters";
import { CommandRegistration } from "../../../api/registration/CommandRegistration";
import {
    prepareCommandInvocation,
    prepareHandlerContext,
} from "./helpers";

/**
 *  Invoke any registered command programmatically in this SDM instance
 *
 *  @param command name of the CommandRegistration or actual CommandRegistration instance to run
 *  @param parameters parameters to be passed to the command
 *  @param ctx HandlerContext instance
 */
export async function invokeCommand<T extends ParameterType>(command: string | CommandRegistration<T>,
                                                             parameters: T,
                                                             ctx: HandlerContext): Promise<HandlerResult> {
    const name = typeof command === "string" ? command : command.name;
    const trigger = (ctx as any as AutomationContextAware).trigger;

    const md = automationClientInstance().automationServer.automations.commands
        .find(c => c.name === name);

    if (!md) {
        return {
            code: 1,
            message: `Command '${name}' could not be found`,
        };
    } else {
        // Invoke the command
        return automationClientInstance().automationServer.invokeCommand(
            prepareCommandInvocation(md, parameters),
            prepareHandlerContext(ctx, trigger),
        );
    }
}
