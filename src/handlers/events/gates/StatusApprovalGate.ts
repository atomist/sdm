/*
 * Copyright © 2017 Atomist, Inc.
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

import { GraphQL, HandlerResult, logger, Secret, Secrets, Success } from "@atomist/automation-client";
import { EventFired, EventHandler, HandleEvent, HandlerContext } from "@atomist/automation-client/Handlers";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { buttonForCommand } from "@atomist/automation-client/spi/message/MessageClient";
import * as slack from "@atomist/slack-messages/SlackMessages";
import { OnAnySuccessStatus, OnSuccessStatus } from "../../../typings/types";
import { addressChannelsFor } from "../../commands/editors/toclient/addressChannels";
import Status = OnSuccessStatus.Status;

/**
 * Added to end of URL of a status to fire manual approval step
 * @type {string}
 */
export const ApprovalGateParam = "?atomist:approve=true";

/**
 * Update a status.
 */
@EventHandler("Approval gate",
    GraphQL.subscriptionFromFile("graphql/subscription/OnAnySuccessStatus.graphql"))
export class StatusApprovalGate implements HandleEvent<OnAnySuccessStatus.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    public async handle(event: EventFired<OnAnySuccessStatus.Subscription>, ctx: HandlerContext, params: this): Promise<HandlerResult> {
        const status: Status = event.data.Status[0];
        const commit = status.commit;

        if (!status.targetUrl.endsWith(ApprovalGateParam)) {
            logger.debug(`********* approval gate got called with status context=[${status.context}]`);
            return Success;
        }

        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);

        const attachment: slack.Attachment = {
            text: `Approve ${status.context}`,
            fallback: "approve",
            actions: [buttonForCommand({text: `Approve ${status.context}`},
                "StatusToApproved",
                {
                    owner: id.owner,
                    repo: id.repo,
                    sha: id.sha,
                    context: status.context,
                    // messageId,
                })],
        };
        const message: slack.SlackMessage = {
            attachments: [attachment],
        };
        const sender = addressChannelsFor(commit.repo, ctx);
        await sender(message);
        return Success;
    }
}
