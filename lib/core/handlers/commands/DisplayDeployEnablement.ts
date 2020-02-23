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
    failure,
    Success,
} from "@atomist/automation-client/lib/HandlerResult";
import { guid } from "@atomist/automation-client/lib/internal/util/string";
import { RepoRef } from "@atomist/automation-client/lib/operations/common/RepoId";
import { buttonForCommand } from "@atomist/automation-client/lib/spi/message/MessageClient";
import {
    bold,
    SlackMessage,
} from "@atomist/slack-messages";
import { CommandListener } from "../../../api/listener/CommandListener";
import { isDeployEnabled } from "../../../api/mapping/support/deployPushTests";
import { CommandHandlerRegistration } from "../../../api/registration/CommandHandlerRegistration";
import { SetDeployEnablementParameters } from "./SetDeployEnablement";

const displayDeployEnablement: CommandListener<SetDeployEnablementParameters> =
    async cli => {
        const enabled = await isDeployEnabled({ context: cli.context, id: cli.parameters as any as RepoRef });
        const msgId = guid();
        return cli.context.messageClient.respond(
            reportDeployEnablement(cli.parameters, enabled, msgId), { id: cli.parameters.msgId })
            .then(() => Success, failure);
    };

export function reportDeployEnablement(params: SetDeployEnablementParameters,
                                       enabled: boolean,
                                       msgId: string): SlackMessage {
    const text = `Deploy is currently ${enabled ? "enabled" : "disabled"} on ${bold(`${params.owner}/${params.repo}`)}`;
    const actions =
        [buttonForCommand({ text: enabled ? "Disable" : "Enable" },
            enabled ? "DisableDeploy" : "EnableDeploy",
            { ...params, msgId })];
    const msg: SlackMessage = {
        attachments: [{
            author_icon: `https://images.atomist.com/rug/check-circle.gif?gif=${guid()}`,
            author_name: "Deploy Enablement",
            text,
            fallback: text,
            color: enabled ? "#37A745" : "#B5B5B5",
            mrkdwn_in: ["text"],
            actions,
            footer: `${params.name}:${params.version}`,
        }],
    };
    return msg;
}

export const DisplayDeployEnablement: CommandHandlerRegistration<SetDeployEnablementParameters> = {
    name: "DisplayDeployEnablement",
    description: "Display whether deployment via Atomist SDM in enabled",
    intent: "is deploy enabled?",
    paramsMaker: SetDeployEnablementParameters,
    listener: displayDeployEnablement,
};
