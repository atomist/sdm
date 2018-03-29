
import { automationServerAuthHeaders, SmokeTestConfig } from "./config";
import { logger } from "@atomist/automation-client";
import { Arg, Secret } from "@atomist/automation-client/internal/invoker/Payload";

import axios from "axios";
import * as _ from "lodash";

export interface CommandHandlerInvocation {
    name: string;
    parameters: Arg[];
    mappedParameters?: Arg[];
    secrets?: Secret[];
}

export async function invokeCommandHandler(config: SmokeTestConfig,
                                           invocation: CommandHandlerInvocation) {
    const url = `${config.baseEndpoint}/command/${_.kebabCase(invocation.name)}`;
    const data = {
        parameters: invocation.parameters,
        mapped_parameters: invocation.mappedParameters,
        secrets: invocation.secrets,
        command: invocation.name,
    };
    logger.info(`Hitting ${url} to test command ${invocation.name} with payload ${JSON.stringify(data)}`);
    const resp = await axios.post(url, data, automationServerAuthHeaders(config));

    // tslint:disable-next-line:no-console
    console.log("RESP was " + resp.status);
    return resp.data;
}

export function editorOneInvocation(editorCommandName: string,
                                    owner: string,
                                    repo: string,
                                    parameters: Arg[] = []): CommandHandlerInvocation {
    return {
        name: editorCommandName,
        parameters,
        mappedParameters: [
            {name: "targets.owner", value: owner },
            {name: "targets.repo", value: repo},
        ],
        secrets: [
            {uri: "github://user_token?scopes=repo,user:email,read:user", value: process.env.GITHUB_TOKEN},
        ],
    };
}
