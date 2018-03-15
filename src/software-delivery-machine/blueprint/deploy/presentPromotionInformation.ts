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

import {
    HandleCommand,
    HandlerContext,
    MappedParameter,
    MappedParameters,
    Parameter,
    Secret,
    Secrets,
} from "@atomist/automation-client";
import { Parameters } from "@atomist/automation-client/decorators";
import { commandHandlerFrom } from "@atomist/automation-client/onCommand";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { TokenCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { addressSlackChannels } from "@atomist/automation-client/spi/message/MessageClient";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import * as slack from "@atomist/slack-messages/SlackMessages";
import { VerifiedDeploymentInvocation } from "../../../common/listener/VerifiedDeploymentListener";
import { runningAttachment } from "../../../handlers/commands/reportRunning";
import { ProductionMauve } from "../../../handlers/events/delivery/goals/commonGoals";
import { tipOfDefaultBranch } from "../../../util/github/ghub";
import { K8sProductionDomain } from "./describeRunningServices";

export async function presentPromotionInformation(inv: VerifiedDeploymentInvocation) {
    const shaLink = slack.url(inv.id.url + "/tree/" + inv.id.sha, inv.id.repo);
    const endpointLink = slack.url(inv.status.targetUrl);
    const messageId = `httpService:promote:prod/${inv.id.repo}/${inv.id.owner}/${inv.id.sha}`;
    const currentlyRunning = await runningAttachment(inv.context,
        (inv.credentials as TokenCredentials).token,
        inv.id as GitHubRepoRef,
        {domain: K8sProductionDomain, color: ProductionMauve}, inv.id.sha);

    const message: slack.SlackMessage = {
        attachments: currentlyRunning,
    };
    return inv.context.messageClient.send(message, inv.messageDestination, {id: messageId});
}

@Parameters()
export class PromotionParameters {
    @Secret(Secrets.UserToken)
    public githubToken;

    @MappedParameter(MappedParameters.GitHubOwner)
    public owner;

    @MappedParameter(MappedParameters.GitHubRepository)
    public repo;

    @Parameter({required: false})
    public sha;

    @MappedParameter(MappedParameters.SlackChannel)
    public channel;
}

export const offerPromotionCommand: Maker<HandleCommand<PromotionParameters>> = () =>
    commandHandlerFrom(async (context: HandlerContext, params: PromotionParameters) => {
            const inv: VerifiedDeploymentInvocation = {
                id: new GitHubRepoRef(params.owner, params.repo, params.sha || await
                    tipOfDefaultBranch(params.githubToken, new GitHubRepoRef(params.owner, params.repo))),
                status: {targetUrl: undefined},
                credentials: {token: params.githubToken},
                messageDestination: addressSlackChannels(params.channel),
                context,
            };
            return presentPromotionInformation(inv);
        }, PromotionParameters, "PromotionInfo", "test: suggest promoting a ref to prod",
        "promotion info");
