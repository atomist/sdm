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
    configurationValue,
    guid,
    HandlerContext,
} from "@atomist/automation-client";
import {
    Attachment,
    SlackMessage,
    url,
} from "@atomist/slack-messages";
import * as base64 from "../base64";

export function slackSuccessMessage(title: string, text: string, options: Partial<Attachment> = {}): SlackMessage {
    const msg: SlackMessage = {
        attachments: [{
            author_icon: `https://images.atomist.com/rug/check-circle.gif?gif=${guid()}`,
            author_name: title,
            text,
            fallback: text,
            color: "#45B254",
            mrkdwn_in: ["text"],
            footer: footer(),
            ...options,
        }],
    };
    return msg;
}

export function slackQuestionMessage(title: string, text: string, options: Partial<Attachment> = {}): SlackMessage {
    const msg: SlackMessage = {
        attachments: [{
            author_icon: `https://images.atomist.com/rug/question.png`,
            author_name: title,
            text,
            fallback: text,
            color: "#767676",
            mrkdwn_in: ["text"],
            footer: footer(),
            ...options,
        }],
    };
    return msg;
}

export function slackWarningMessage(title: string, text: string, ctx: HandlerContext, options: Partial<Attachment> = {}): SlackMessage {
    const msg: SlackMessage = {
        attachments: [{
            author_icon: `https://images.atomist.com/rug/warning-yellow.png`,
            author_name: title,
            text,
            fallback: text,
            color: "#ffcc00",
            mrkdwn_in: ["text"],
            footer: slackSupportLink(ctx),
            ...options,
        }],
    };
    return msg;
}

export function slackErrorMessage(title: string, text: string, ctx: HandlerContext, options: Partial<Attachment> = {}): SlackMessage {
    const msg: SlackMessage = {
        attachments: [{
            author_icon: "https://images.atomist.com/rug/error-circle.png",
            author_name: title,
            text,
            fallback: text,
            color: "#D94649",
            mrkdwn_in: ["text"],
            footer: slackSupportLink(ctx),
            ...options,
        }],
    };
    return msg;
}

export function slackSupportLink(ctx: HandlerContext): string {
    const supportUrl =
        `https://atomist.typeform.com/to/yvnyOj?message_id=${base64.encode(ctx.invocationId)}`;
    return `${footer} | ${url(supportUrl, "Support")}`;
}

export function footer(): string {
    return `${configurationValue<string>("name")}:${configurationValue<string>("version")}`;
}