import { buttonForCommand } from "@atomist/automation-client/spi/message/MessageClient";
import * as slack from "@atomist/slack-messages/SlackMessages";
import { OnVerifiedStatus } from "../../handlers/events/delivery/OnVerifiedStatus";
import { HandleEvent } from "@atomist/automation-client";

export const OfferPromotion: HandleEvent<any> = new OnVerifiedStatus(
    (id, s, addressChannels) => {
        console.log("Offering promotion");
        const attachment: slack.Attachment = {
                text: "Endpoint has been verified. Promote this build to production?",
                fallback: "offer to promote",
                actions: [buttonForCommand({text: "Promote to Prod"},
                    "DeployToProd",
                    {repo: id.repo, owner: id.owner, sha: id.sha},
                ),
                ],
            }
        ;
        const message: slack.SlackMessage = {
            attachments: [attachment],
        };
        return addressChannels(message);
    },
    )
;
