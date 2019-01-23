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
import * as _ from "lodash";
import { CommandSuspendingError } from "../../api-helper/machine/handlerRegistrations";
import { ParametersDefinition } from "../registration/ParametersDefinition";

export type ParameterPromptFactory<PARAMS> = (ctx: HandlerContext) => ParameterPrompt<PARAMS>;

export type ParameterPrompt<PARAMS> = (parameters: ParametersDefinition<PARAMS>) => Promise<PARAMS>;

export const NoParameterPrompt: ParameterPrompt<any> = async () => ({});

export function commandRequestParameterPromptFactory<T>(ctx: HandlerContext): ParameterPrompt<T> {
    return async parameters => {
        const newParameters = _.cloneDeep(parameters);
        const trigger = (ctx as any as AutomationContextAware).trigger as CommandIncoming;
        const existingParameters = trigger.parameters;

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

        if (!missing) {
            return params;
        }

        const response: HandlerResponse & { parameters: Arg[], parameter_specs: any[] } = {
            api_version: "1",
            correlation_id: trigger.correlation_id,
            team: trigger.team,
            command: trigger.command,
            source: trigger.source,
            parameters: trigger.parameters,
            parameter_specs: _.map(newParameters, (v, k) => ({
                ...v,
                name: k,
            })),
            content_type: "application/x-atomist-continuation+json",
        };

        await configurationValue<WebSocketLifecycle>("ws.lifecycle").send(response);
        throw new CommandSuspendingError(`Prompting for new parameters: ${_.map(newParameters, (v, k) => k).join(", ")}`);
    };
}


