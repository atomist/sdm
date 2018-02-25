import { buttonForCommand } from "@atomist/automation-client/spi/message/MessageClient";
import * as slack from "@atomist/slack-messages/SlackMessages";
import { ListenerInvocation } from "../../../handlers/events/delivery/Listener";
import { AddCloudFoundryManifestEditorName } from "../../commands/editors/addCloudFoundryManifest";

export function suggestAddingCloudFoundryManifest(inv: ListenerInvocation) {
    const attachment: slack.Attachment = {
            text: "Add a Cloud Foundry manifest to your new repo?",
            fallback: "add PCF manifest",
            actions: [buttonForCommand({text: "Add Cloud Foundry Manifest"},
                AddCloudFoundryManifestEditorName,
                {"targets.owner": inv.id.owner, "targets.repo": inv.id.repo},
            ),
            ],
        }
    ;
    const message: slack.SlackMessage = {
        attachments: [attachment],
    };
    return inv.addressChannels(message);
}
