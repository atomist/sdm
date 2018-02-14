import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { OnFirstPushToRepo } from "../../handlers/events/repo/OnFirstPushToRepo";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { buttonForCommand } from "@atomist/automation-client/spi/message/MessageClient";
import { AddressChannels } from "../../handlers/commands/editors/toclient/addressChannels";
import * as slack from "@atomist/slack-messages/SlackMessages";
import { AddCloudFoundryManifestEditorName } from "../commands/editors/addCloudFoundryManifest";

export const onNewRepoWithCode = new OnFirstPushToRepo(addCloudFoundryManifest);

// TODO really should invoke a button

function addCloudFoundryManifest(id: GitHubRepoRef, creds: ProjectOperationCredentials, addressChannels: AddressChannels) {
    const attachment: slack.Attachment = {
            text: "Add a Cloud Foundry manifest to your new repo?",
            fallback: "add PCF manifest",
            actions: [buttonForCommand({text: "Add Cloud Foundry Manifest"},
                AddCloudFoundryManifestEditorName,
                {"targets.owner": id.owner, "targets.repo": id.repo},
            ),
            ],
        }
    ;
    const message: slack.SlackMessage = {
        attachments: [attachment],
    };
    return addressChannels(message);
}
