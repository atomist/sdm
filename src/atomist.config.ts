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

import { logger } from "@atomist/automation-client";
import { Configuration } from "@atomist/automation-client/configuration";
import * as appRoot from "app-root-path";
import * as _ from "lodash";
import { DeployEnablementIngester } from "./ingesters/deployEnablement";
import { cloudFoundrySoftwareDeliveryMachine } from "./software-delivery-machine/cloudFoundrySoftwareDeliveryMachine";

// tslint:disable-next-line:no-var-requires
const pj = require(`${appRoot.path}/package.json`);

/**
 * Prefix for Atomist workspaces in config
 * @type {string}
 */
const AtomistWorkspacePrefix = "ATOMIST_WORKSPACE_";

const token = process.env.GITHUB_TOKEN;

/*
 * The provided software delivery machines include cloud foundry (which runs locally for Test environment,
 * by default, and your PCF for Prod) and kubernetes (which deploys Spring-boot services to an Atomist-provided
 * cluster for Test and Prod). Take your pick.
 */
const assembled =
    cloudFoundrySoftwareDeliveryMachine({ useCheckstyle: process.env.USE_CHECKSTYLE === "true" });
// k8sSoftwareDeliveryMachine({ useCheckstyle: process.env.USE_CHECKSTYLE === "true"})

export const configuration: Configuration = {
    name: pj.name,
    version: pj.version,
    // <-- obtain the ID from the settings page of your Atomist workspace at https://app.atomist.com,
    // then set your env variable
    teamIds: extractWorkspacesFromEnvironment(),
    commands: assembled.commandHandlers.concat([]),
    events: assembled.eventHandlers.concat([]),
    // TODO CD move ingesters to different global automation
    ingesters: [
        DeployEnablementIngester,
    ],
    token,
    http: {
        enabled: false,
    },
    applicationEvents: {
        enabled: true,
    },
    logging: {
        level: "debug",
    },
};

/**
 * Extract workspaces from environment variables
 * @return {string[]}
 */
function extractWorkspacesFromEnvironment(): string[] {
    if (!!process.env.ATOMIST_WORKSPACE) {
        return [process.env.ATOMIST_WORKSPACE];
    }

    let workspaces: string[] = [];
    for (const key in process.env) {
        if (key.startsWith(AtomistWorkspacePrefix)) {
            const teamId = process.env[key];
            logger.info("Adding workspace %s, team id=%s", key.substr(AtomistWorkspacePrefix.length), teamId);
            workspaces.push(teamId);
        }
    }
    workspaces = _.uniq(workspaces);
    logger.info("Teams to be used=%s", workspaces.join());
    return workspaces;
}
