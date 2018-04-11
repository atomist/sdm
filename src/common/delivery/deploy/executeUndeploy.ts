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

import { logger, Success } from "@atomist/automation-client";
import { buttonForCommand } from "@atomist/automation-client/spi/message/MessageClient";
import { Attachment, SlackMessage } from "@atomist/slack-messages";
import * as stringify from "json-stringify-safe";
import { DeleteRepositoryCommandName, DeleteRepositoryParameters } from "../../../handlers/commands/deleteRepository";
import { GitHubDotComProviderId } from "../../../util/github/gitHubProvider";
import { ExecuteGoalWithLog, RunWithLogContext } from "../goals/support/reportGoalError";
import { Target } from "./deploy";

export function executeUndeploy(target: Target): ExecuteGoalWithLog {
    return async (rwlc: RunWithLogContext) => {
        const {id, credentials, status, progressLog} = rwlc;
        const commit = status.commit;
        const pushBranch = commit.pushes[0].branch;
        progressLog.write(`Commit is on ${commit.pushes.length} pushes. Choosing the first one, branch ${pushBranch}`);

        const targetInfo = target.targeter(id, pushBranch);
        const deployments = await target.deployer.findDeployments(id, targetInfo, credentials);
        if (!deployments) {
            progressLog.write("No deployments found");
            return Success;
        }

        logger.info("Detected deployments: %s", deployments.map(stringify).join(", "));

        deployments.forEach(async d =>
            target.deployer.undeploy(
                targetInfo,
                d,
                progressLog,
            ));
        return {code: 0};
    };
}

export function offerToDeleteRepository(): ExecuteGoalWithLog {
    return async (rwlc: RunWithLogContext) => {
        const {addressChannels, id} = rwlc;

        const params = new DeleteRepositoryParameters();
        params.owner = id.owner;
        params.repo = id.repo;
        params.providerId = GitHubDotComProviderId; // we should put this in the RWLC?
        params.areYouSure = "yes";

        const deleteRepoButton = buttonForCommand({text: "Delete Repo", style: "danger"},
            DeleteRepositoryCommandName,
            params as any);

        const attachment: Attachment = {
            fallback: "delete repository button",
            color: "#ff0234",
            text: "Would you like to delete this repository?",
            actions: [deleteRepoButton],
        };

        const message: SlackMessage = {
            attachments: [attachment],
        };
        await addressChannels(message);

        return Success;
    };
}
