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

import {
    MappedParameter,
    MappedParameters,
    Parameter,
    Parameters,
    Value,
} from "@atomist/automation-client/lib/decorators";
import {
    failure,
    HandlerError,
    HandlerResult,
    Success,
} from "@atomist/automation-client/lib/HandlerResult";
import { addressEvent } from "@atomist/automation-client/lib/spi/message/MessageClient";
import { bold } from "@atomist/slack-messages";
import { slackSuccessMessage } from "../../../api-helper/misc/slack/messages";
import { CommandListenerInvocation } from "../../../api/listener/CommandListener";
import { CommandHandlerRegistration } from "../../../api/registration/CommandHandlerRegistration";
import {
    DeployEnablementRootType,
    SdmDeployEnablement,
} from "../../ingesters/sdmDeployEnablement";

@Parameters()
export class SetDeployEnablementParameters {

    @Parameter({ required: false, displayable: false })
    public msgId?: string;

    @MappedParameter(MappedParameters.GitHubOwner)
    public owner: string;

    @MappedParameter(MappedParameters.GitHubRepository)
    public repo: string;

    @MappedParameter(MappedParameters.GitHubRepositoryProvider)
    public providerId: string;

    @Value("name")
    public name: string;

    @Value("version")
    public version: string;
}

/**
 * Command to set deploy enablement on the currently mapped repo
 * @param {CommandListenerInvocation} cli
 * @param {boolean} enable
 * @returns {Promise<HandlerResult | HandlerError>}
 */
export function setDeployEnablement(cli: CommandListenerInvocation<SetDeployEnablementParameters>,
                                    enable: boolean): Promise<HandlerResult | HandlerError> {
    const deployEnablement: SdmDeployEnablement = {
        state: enable ? "requested" : "disabled",
        owner: cli.parameters.owner,
        repo: cli.parameters.repo,
        providerId: cli.parameters.providerId,
    };
    return cli.context.messageClient.send(deployEnablement, addressEvent(DeployEnablementRootType))
        .then(() => cli.context.messageClient.respond(
            slackSuccessMessage(
                "Deploy Enablement",
                `Successfully ${enable ? "enabled" : "disabled"} deployment of ${
                    bold(`${cli.parameters.owner}/${cli.parameters.repo}`)}`,
                {
                    footer: `${cli.parameters.name}:${cli.parameters.version}`,
                }), { id: cli.parameters.msgId }))
        .then(() => Success, failure);
}

export const EnableDeploy: CommandHandlerRegistration<SetDeployEnablementParameters> = {
    name: "EnableDeploy",
    intent: "enable deploy",
    description: "Enable deployment via Atomist SDM",
    paramsMaker: SetDeployEnablementParameters,
    listener: async cli => setDeployEnablement(cli, true),
};

export const DisableDeploy: CommandHandlerRegistration<SetDeployEnablementParameters> = {
    name: "DisableDeploy",
    intent: "disable deploy",
    description: "Disable deployment via Atomist SDM",
    paramsMaker: SetDeployEnablementParameters,
    listener: async cli => setDeployEnablement(cli, false),
};
