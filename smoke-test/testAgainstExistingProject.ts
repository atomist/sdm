/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import "mocha";
import { automationServerAuthHeaders, DefaultSmokeTestConfig, SmokeTestConfig } from "./config";

import axios from "axios";
import { Arg } from "@atomist/automation-client/internal/invoker/Payload";
import { SelfDescribeCommandName } from "../src/handlers/commands/SelfDescribe";
import * as stringify from "json-stringify-safe";
import * as _ from "lodash";
import * as assert from "assert";

const testConfig: SmokeTestConfig = DefaultSmokeTestConfig;

describe("local SDM", () => {

    describe("basic thereness", () => {

        it("can describe itself", async () => {
            const handlerResult = await invokeCommandHandler(testConfig, {
                name: SelfDescribeCommandName,
                parameters: [],
            });
            assert(handlerResult.message.includes("brilliant"), "Not brilliant: " + stringify(handlerResult));
        });

    });

    describe("test against existing project", () => {

        it("changes readme", async () => {
            const url = testConfig.baseEndpoint + "/info";
            const resp = await axios.get(url, automationServerAuthHeaders(testConfig));
            console.log("RESP was " + resp.status);
        });

    });

});

export interface CommandHandlerInvocation {
    name: string;
    parameters: Arg[];
    mappedParameters?: Arg[];
    secrets?: Arg[];
}

export async function invokeCommandHandler(config: SmokeTestConfig,
                                           invocation: CommandHandlerInvocation) {
    const url = `${testConfig.baseEndpoint}/command/${_.kebabCase(invocation.name)}`;
    const data = {
        parameters: invocation.parameters,
        mapped_parameters: invocation.mappedParameters,
        secrets: invocation.secrets,
        command: invocation.name,
    };
    console.log(`Hitting ${url} to test command ${invocation.name} with payload ${JSON.stringify(data)}`);
    const resp = await axios.post(url, data, automationServerAuthHeaders(testConfig));

    console.log("RESP was " + resp.status);
    return resp.data;
}
