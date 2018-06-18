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

import { HandlerContext, Success } from "@atomist/automation-client";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { SourceLocation } from "@atomist/automation-client/operations/common/SourceLocation";
import { ProjectReview, ReviewComment } from "@atomist/automation-client/operations/review/ReviewResult";
import { buttonForCommand } from "@atomist/automation-client/spi/message/MessageClient";
import { deepLink as githubDeepLink } from "@atomist/automation-client/util/gitHub";
import * as slack from "@atomist/slack-messages";
import { Attachment, SlackMessage } from "@atomist/slack-messages";
import { AddressChannels } from "../../../api/context/addressChannels";
import { ReviewListener } from "../../../api/listener/ReviewListener";
import { PushReactionResponse } from "../../../api/registration/PushReactionRegistration";

/**
 * Strategy for deep linking to a source control system.
 */
export type DeepLink = (grr: RemoteRepoRef, sourceLocation: SourceLocation) => string;

export interface SlackReviewRoutingParams {
    pushReactionResponse?: PushReactionResponse;
    deepLink: DeepLink;
}

/**
 * Route reviews to Slack in linked channels
 */
export function slackReviewListener(opts: Partial<SlackReviewRoutingParams> = {}): ReviewListener {
    const paramsToUse = {
        pushReactionResponse: opts.pushReactionResponse,
        deepLink: opts.deepLink || githubDeepLink,
    };
    return async ri => {
        if (ri.review.comments.length > 0) {
            await sendReviewToSlack("Review comments", ri.review, ri.context, ri.addressChannels, paramsToUse.deepLink);
            return paramsToUse.pushReactionResponse;
        }
    };
}

async function sendReviewToSlack(title: string,
                                 pr: ProjectReview,
                                 ctx: HandlerContext,
                                 addressChannels: AddressChannels,
                                 deepLink: DeepLink) {
    const mesg: SlackMessage = {
        text: `*${title} on ${pr.repoId.owner}/${pr.repoId.repo}*`,
        attachments: pr.comments.map(c => reviewCommentToAttachment(pr.repoId as GitHubRepoRef, c, deepLink)),
    };
    await addressChannels(mesg);
    return Success;
}

function reviewCommentToAttachment(grr: GitHubRepoRef, rc: ReviewComment, deepLink: DeepLink): Attachment {
    const link = rc.sourceLocation ? slack.url(deepLink(grr, rc.sourceLocation), "jump to") :
        slack.url(grr.url + "/tree/" + grr.sha, "source");

    return {
        color: "#ff0000",
        author_name: rc.category,
        author_icon: "https://image.shutterstock.com/z/stock-vector-an-image-of-a-red-grunge-x-572409526.jpg",
        text: `${link} ${rc.detail}`,
        mrkdwn_in: ["text"],
        fallback: "error",
        actions: !!rc.fix ? [
            buttonForCommand({text: "Fix"}, rc.fix.command, rc.fix.params),
        ] : [],
    };
}
