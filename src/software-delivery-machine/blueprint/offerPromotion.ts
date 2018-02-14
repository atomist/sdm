import {HandleEvent} from "@atomist/automation-client";
import {buttonForCommand} from "@atomist/automation-client/spi/message/MessageClient";
import * as slack from "@atomist/slack-messages/SlackMessages";
import {OnVerifiedStatus} from "../../handlers/events/delivery/OnVerifiedStatus";

/**
 * Display a button suggesting promotion to production
 * @type {OnVerifiedStatus}
 */
export const OfferPromotion: HandleEvent<any> = new OnVerifiedStatus(
    (id, s, sendMessagesHere, ctx) => {
        const messageId = "httpService:promote:prod/${id.repo}/${id.owner}/${id.sha}";
        const attachment: slack.Attachment = {
            text: "Endpoint has been verified. Promote this build to production?",
            fallback: "offer to promote",
            actions: [buttonForCommand({text: "Promote to Prod"},
                "DeployToProd",
                {
                    repo: id.repo, owner: id.owner, sha: id.sha,
                    messageId,
                    destinationsJson: JSON.stringify(sendMessagesHere),
                })],
        };
        const message: slack.SlackMessage = {
            attachments: [attachment],
        };
        return ctx.messageClient.send(message, sendMessagesHere, {id: messageId});
    },
);
