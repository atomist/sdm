import { buttonForCommand } from "@atomist/automation-client/spi/message/MessageClient";
import * as slack from "@atomist/slack-messages/SlackMessages";
import { ProjectListenerInvocation } from "../../../common/listener/Listener";
import { AddCloudFoundryManifestCommandName } from "../../commands/editors/pcf/addCloudFoundryManifest";

export async function suggestAddingCloudFoundryManifest(inv: ProjectListenerInvocation) {
    try {
        const f = await inv.project.findFile("pom.xml");
        const content = await f.getContent();
        const isSpringBoot = content.includes("spring-boot");

        if (isSpringBoot) {
            const attachment: slack.Attachment = {
                    text: "Add a Cloud Foundry manifest to your new repo?",
                    fallback: "add PCF manifest",
                    actions: [buttonForCommand({text: "Add Cloud Foundry Manifest"},
                        AddCloudFoundryManifestCommandName,
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
    } catch {
        // It's not a Maven project, we don't know how to deploy it
    }
}
