import { buttonForCommand } from "@atomist/automation-client/spi/message/MessageClient";
import * as slack from "@atomist/slack-messages/SlackMessages";
import { ProjectListenerInvocation } from "../../../common/listener/Listener";
import { AddK8sSpecCommandName } from "../../commands/editors/k8s/addK8sSpec";

/**
 * Present a button suggesting a Kubernetes spec is added by an editor
 * @param {ProjectListenerInvocation} inv
 * @return {Promise<any>}
 */
export async function suggestAddingK8sSpec(inv: ProjectListenerInvocation) {
    try {
        const f = await inv.project.findFile("pom.xml");
        const content = await f.getContent();
        const isSpringBoot = content.includes("spring-boot");

        if (isSpringBoot) {
            const attachment: slack.Attachment = {
                    text: "Add a Kubernetes spec to your new repo?",
                    fallback: "add Kubernetes spec",
                    actions: [buttonForCommand({text: "Add Kubernetes spec"},
                        AddK8sSpecCommandName,
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
