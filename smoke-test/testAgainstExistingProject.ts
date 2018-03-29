import { logger } from "@atomist/automation-client";
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

import { Arg, Secret } from "@atomist/automation-client/internal/invoker/Payload";
import * as assert from "assert";
import axios from "axios";
import * as stringify from "json-stringify-safe";
import * as _ from "lodash";
import { SelfDescribeCommandName } from "../src/handlers/commands/SelfDescribe";
import { AffirmationEditorName } from "../src/software-delivery-machine/commands/editors/demo/affirmationEditor";

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
            // TODO factor out editor parameters
            const handlerResult = await invokeCommandHandler(testConfig, {
                name: AffirmationEditorName,
                parameters: [
                ],
                mappedParameters: [
                    // TODO get rid of hard coding of owning team
                    { name: "owner", value: "spring-team"},
                    { name: "targets.repo", value: "losgatos1"},
                ],
                secrets: [
                    { uri: "github://user_token?scopes=repo,user:email,read:user", value: process.env.GITHUB_TOKEN},
                ],
            });
        });

    });

});

export interface CommandHandlerInvocation {
    name: string;
    parameters: Arg[];
    mappedParameters?: Arg[];
    secrets?: Secret[];
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
    logger.info(`Hitting ${url} to test command ${invocation.name} with payload ${JSON.stringify(data)}`);
    const resp = await axios.post(url, data, automationServerAuthHeaders(testConfig));

    // tslint:disable-next-line:no-console
    console.log("RESP was " + resp.status);
    return resp.data;
}
