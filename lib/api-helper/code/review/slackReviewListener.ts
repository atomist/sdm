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
    buttonForCommand,
    deepLink as githubDeepLink,
    GitHubRepoRef,
    HandlerContext,
    HandlerResult,
    ProjectReview,
    RemoteRepoRef,
    ReviewComment,
    SourceLocation,
    Success,
} from "@atomist/automation-client";
import * as slack from "@atomist/slack-messages";
import { AddressChannels } from "../../../api/context/addressChannels";
import { ReviewListener } from "../../../api/listener/ReviewListener";
import { PushImpactResponse } from "../../../api/registration/PushImpactListenerRegistration";
import { ReviewListenerRegistration } from "../../../api/registration/ReviewListenerRegistration";

/**
 * Strategy for deep linking to a source control system.
 */
export type DeepLink = (grr: RemoteRepoRef, sourceLocation: SourceLocation) => string;

export interface SlackReviewRoutingParams {
    pushReactionResponse?: PushImpactResponse;
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
        return undefined;
    };
}

export function slackReviewListenerRegistration(opts: Partial<SlackReviewRoutingParams> = {}): ReviewListenerRegistration {
    return {
        name: "SlackReviewListener",
        listener: slackReviewListener(opts),
    };
}

async function sendReviewToSlack(title: string,
                                 pr: ProjectReview,
                                 ctx: HandlerContext,
                                 addressChannels: AddressChannels,
                                 deepLink: DeepLink): Promise<HandlerResult> {
    const mesg: slack.SlackMessage = {
        text: `*${title} on ${pr.repoId.owner}/${pr.repoId.repo}*`,
        attachments: pr.comments.map(c => reviewCommentToAttachment(pr.repoId as GitHubRepoRef, c, deepLink)),
    };
    await addressChannels(mesg);
    return Success;
}

function reviewCommentToAttachment(grr: GitHubRepoRef, rc: ReviewComment, deepLink: DeepLink): slack.Attachment {
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
