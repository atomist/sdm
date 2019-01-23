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
    CommandIncoming,
    configurationValue,
    HandlerContext,
} from "@atomist/automation-client";
import { Arg } from "@atomist/automation-client/lib/internal/transport/RequestProcessor";
import { WebSocketLifecycle } from "@atomist/automation-client/lib/internal/transport/websocket/WebSocketLifecycle";
import { HandlerResponse } from "@atomist/automation-client/lib/internal/transport/websocket/WebSocketMessageClient";
import { Parameter } from "@atomist/automation-client/lib/metadata/automationMetadata";
import * as _ from "lodash";
import { CommandListenerExecutionInterruptError } from "../../api-helper/machine/handlerRegistrations";
import { ParametersObjectValue } from "../registration/ParametersDefinition";

/**
 * Object with properties defining parameters. Useful for combination via spreads.
 */
export type ParametersPromptObject<PARAMS, K extends keyof PARAMS = keyof PARAMS> = Record<K, ParametersObjectValue>;

/**
 * Factory to create a ParameterPrompt
 */
export type ParameterPromptFactory<PARAMS> = (ctx: HandlerContext) => ParameterPrompt<PARAMS>;

/**
 * ParameterPrompts let the caller prompt for the provided parameters
 */
export type ParameterPrompt<PARAMS> = (parameters: ParametersPromptObject<PARAMS>) => Promise<PARAMS>;

/**
 * No-op NoParameterPrompt implementation that never prompts for new parameters
 * @constructor
 */
export const NoParameterPrompt: ParameterPrompt<any> = async () => ({});

export const AtomistContinuationMimeType = "application/x-atomist-continuation+json";

/**
 * Default ParameterPromptFactory that uses the WebSocket connection to send parameter prompts to the backend.
 * @param ctx
 */
export function commandRequestParameterPromptFactory<T>(ctx: HandlerContext): ParameterPrompt<T> {
    return async parameters => {
        const trigger = (ctx as any as AutomationContextAware).trigger as CommandIncoming;

        const existingParameters = trigger.parameters;
        const newParameters = _.cloneDeep(parameters);

        // Find out if - and if - which parameters are actually missing
        let missing = false;
        const params: any = {};
        for (const parameter in parameters) {
            if (!existingParameters.some(p => p.name === parameter)) {
                missing = true;
            } else {
                params[parameter] = existingParameters.find(p => p.name === parameter).value;
                delete newParameters[parameter];
            }
        }

        // If no parameters are missing we can return the already collected parameters
        if (!missing) {
            return params;
        }

        // Create a continuation message using the existing HandlerResponse and mixing in parameters
        // and parameter_specs
        const response: HandlerResponse & { parameters: Arg[], parameter_specs: Parameter[] } = {
            api_version: "1",
            correlation_id: trigger.correlation_id,
            team: trigger.team,
            command: trigger.command,
            source: trigger.source,
            parameters: trigger.parameters,
            parameter_specs: _.map(newParameters, (v, k) => ({
                ...v,
                name: k,
                required: v.required !== undefined ? v.required : true,
                pattern: v.pattern ? v.pattern.source : undefined,
            })),
            content_type: AtomistContinuationMimeType,
        };

        await configurationValue<WebSocketLifecycle>("ws.lifecycle").send(response);
        throw new CommandListenerExecutionInterruptError(
            `Prompting for new parameters: ${_.map(newParameters, (v, k) => k).join(", ")}`);
    };
}
