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
    AutomationContextAware,
    HandlerContext,
} from "@atomist/automation-client/lib/HandlerContext";
import { CommandInvocation } from "@atomist/automation-client/lib/internal/invoker/Payload";
import {
    isCommandIncoming,
    isEventIncoming,
} from "@atomist/automation-client/lib/internal/transport/RequestProcessor";
import { CommandHandlerMetadata } from "@atomist/automation-client/lib/metadata/automationMetadata";
import { ParameterType } from "@atomist/automation-client/lib/SmartParameters";
import {
    mergeParameters,
    MessageOptions,
    SourceDestination,
} from "@atomist/automation-client/lib/spi/message/MessageClient";

/**
 * Prepare the CommandInvocation instance to be sent for execution
 *
 * This pieces apart provided values form the parameters into the command's parameter, mapped parameter
 * and secret structures.
 */
export function prepareCommandInvocation(md: CommandHandlerMetadata,
                                         parameters: ParameterType = {}): CommandInvocation {
    // Flatten the provided parameters before creating the CommandInvocation
    const params = mergeParameters(parameters, {});
    const ci: CommandInvocation = {
        name: md.name,
        args: md.parameters.filter(p => params[p.name] !== undefined).map(p => ({
            name: p.name,
            value: params[p.name],
        })),
        mappedParameters: md.mapped_parameters.filter(p => params[p.name] !== undefined).map(p => ({
            name: p.name,
            value: params[p.name],
        })),
        secrets: md.secrets.map(p => ({
            uri: p.uri,
            value: params[p.name] || "null",
        })),
    };
    return ci;
}

/**
 * Decorate the HandlerContext to support response messages for this event handler invocation.
 *
 * Task execution happens is rooted in an event handler executing; this would prevent response
 * messages to work out of the box which is why this function adds the respond function to the
 * MessageClient if possible.
 */
export function prepareHandlerContext(ctx: HandlerContext, trigger: any): HandlerContext {
    if (isCommandIncoming(trigger)) {
        const source = trigger.source;
        if (!!source) {
            ctx.messageClient.respond = (msg: any, options?: MessageOptions) => {
                return ctx.messageClient.send(msg, new SourceDestination(source, source.user_agent), options);
            };
        }
    } else if (isEventIncoming(trigger)) {
        ctx.messageClient.respond = async () => {
            return;
        };
    }
    if (!!trigger) {
        (ctx as any as AutomationContextAware).trigger = trigger;
    }
    return ctx;
}
