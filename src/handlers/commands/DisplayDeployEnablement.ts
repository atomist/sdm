/*
 * Copyright © 2018 Atomist, Inc.
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
    HandleCommand,
    HandlerResult,
    Success,
} from "@atomist/automation-client";
import { HandlerContext } from "@atomist/automation-client/Handlers";
import { guid } from "@atomist/automation-client/internal/util/string";
import { commandHandlerFrom } from "@atomist/automation-client/onCommand";
import { buttonForCommand } from "@atomist/automation-client/spi/message/MessageClient";
import { SlackMessage } from "@atomist/slack-messages";
import { isDeployEnabled } from "../../api/mapping/support/deployPushTests";
import { SetDeployEnablementParameters } from "./SetDeployEnablement";

function displayDeployEnablement() {
    return async (context: HandlerContext, params: SetDeployEnablementParameters): Promise<HandlerResult> => {
        const enabled = await isDeployEnabled({context, id: params});
        return context.messageClient.respond(
            reportDeployEnablement(params, enabled))
            .then(() => Success, failure);
    };
}

export function reportDeployEnablement(params: SetDeployEnablementParameters, enabled: boolean): SlackMessage {
    const text = `SDM Deployment is currently ${enabled ? "enabled" : "disabled"} on ${params.owner}/${params.repo}`;
    const actions =
        [buttonForCommand({text: enabled ? "Disable" : "Enable"},
            enabled ? "DisableDeploy" : "EnableDeploy",
            {...params})];
    const msg: SlackMessage = {
        attachments: [{
            author_icon: `https://images.atomist.com/rug/check-circle.gif?gif=${guid()}`,
            author_name: "SDM Deployment",
            text,
            fallback: text,
            color: enabled ? "#45B254" : "#aaaaaa",
            mrkdwn_in: ["text"],
            actions,
        }],
    };
    return msg;
}

export function isDeployEnabledCommand(): HandleCommand<SetDeployEnablementParameters> {
    return commandHandlerFrom(
        displayDeployEnablement(),
        SetDeployEnablementParameters,
        "DisplayDeployEnablement",
        "Display whether deployment via Atomist SDM in enabled",
        "is deploy enabled?",
    );
}
