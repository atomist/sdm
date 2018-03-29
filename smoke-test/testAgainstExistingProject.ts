import "mocha";
import { automationServerAuthHeaders, DefaultSmokeTestConfig, SmokeTestConfig } from "./config";

import axios from "axios";
import { Arg, CommandInvocation } from "@atomist/automation-client/internal/invoker/Payload";
import { SelfDescribeCommandName } from "../src/handlers/commands/SelfDescribe";

const testConfig: SmokeTestConfig = DefaultSmokeTestConfig;

describe("local SDM", () => {

    describe("basic thereness", () => {

        it("can describe itself", async () => {
            await invokeCommandHandler(testConfig, {
                name: SelfDescribeCommandName,
                parameters: [],
            });
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

import * as _ from "lodash";

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
        mapped_paramers: invocation.mappedParameters,
        secrets: invocation.secrets,
    };
    console.log(`Hitting ${url} to test command ${invocation.name} with payload ${JSON.stringify(data)}`);
    const resp = await axios.post(url, data, automationServerAuthHeaders(testConfig));
    console.log("RESP was " + resp.status);
}
