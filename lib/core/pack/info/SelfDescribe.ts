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

import { automationClientInstance } from "@atomist/automation-client/lib/globals";
import { Success } from "@atomist/automation-client/lib/HandlerResult";
import { info } from "@atomist/automation-client/lib/internal/util/info";
import { NoParameters } from "@atomist/automation-client/lib/SmartParameters";
import {
    bold,
    codeLine,
    SlackMessage,
} from "@atomist/slack-messages";
import * as appRoot from "app-root-path";
import * as path from "path";
import { CommandListener } from "../../../api/listener/CommandListener";
import { SoftwareDeliveryMachine } from "../../../api/machine/SoftwareDeliveryMachine";
import { CommandHandlerRegistration } from "../../../api/registration/CommandHandlerRegistration";

/**
 * Return a command handler that can describe the present software delivery machine
 * @param {SoftwareDeliveryMachine} sdm
 * @return {HandleCommand<EmptyParameters>}
 */
export function selfDescribeCommand(sdm: SoftwareDeliveryMachine): CommandHandlerRegistration {
    return {
        name: "SelfDescribe",
        listener: selfDescribeListener(sdm),
        description: "Describe this SDM",
        intent: [`describe sdm ${sdm.configuration.name.replace("@", "")}`],
    };
}

function selfDescribeListener(sdm: SoftwareDeliveryMachine): CommandListener<NoParameters> {
    return async cli => {
        const pj = require(path.join(appRoot.path, "package.json"));
        const clientPj = require(path.join(appRoot.path, "node_modules", "@atomist", "automation-client", "package.json"));
        const sdmPj = require(path.join(appRoot.path, "node_modules", "@atomist", "sdm", "package.json"));
        const gitInfo = info(automationClientInstance().automations.automations);

        const msg: SlackMessage = {
            attachments: [{
                author_name: pj.author && pj.author.name ? pj.author.name : pj.author,
                title: sdm.name,
                title_link: pj.homepage,
                fallback: sdm.name,
                text: `${pj.description}
Version: ${codeLine(sdm.configuration.version)} - License: ${codeLine(pj.license)}`,
            }, {
                author_name: "Details",
                fallback: "Details",
                text: `Sha: ${codeLine(gitInfo.git && gitInfo.git.sha ? gitInfo.git.sha.slice(0, 7) : "n/a")}
Repository: ${codeLine(gitInfo.git && gitInfo.git.repository ? gitInfo.git.repository : "n/a")}
Policy: ${codeLine(sdm.configuration.policy)}
Environment: ${codeLine(sdm.configuration.environment)}
Cluster: ${codeLine(sdm.configuration.cluster.enabled ? "enabled" : "disabled")}`,
            }, {
                author_name: "Dependencies",
                fallback: "Dependencies",
                text: `${codeLine(`${clientPj.name}:${clientPj.version}`)}
${codeLine(`${sdmPj.name}:${sdmPj.version}`)}`,
            }, {
                author_name: "Extension Packs",
                fallback: "Extension Packs",
                text: [...sdm.extensionPacks]
                    .sort((e1, e2) => e1.name.localeCompare(e2.name))
                    .map(e => `${codeLine(`${e.name}:${e.version}`)} ${e.vendor}`).join("\n"),
            }, {
                author_name: "Events",
                fallback: "Events",
                text: automationClientInstance().automations.automations.events
                    .sort((e1, e2) => e1.name.localeCompare(e2.name))
                    .map(e => `${bold(e.name)} ${e.description}`).join("\n"),
            }, {
                author_name: "Commands",
                fallback: "Commands",
                text: automationClientInstance().automations.automations.commands
                    .sort((e1, e2) => e1.name.localeCompare(e2.name))
                    .map(e => `${bold(e.name)} ${e.intent.map(codeLine).join(", ")} ${e.description}`).join("\n"),
                footer: `${sdm.configuration.name}:${sdm.configuration.version}`,
            }],
        };

        await cli.context.messageClient.respond(msg);
        return Success;
    };
}
