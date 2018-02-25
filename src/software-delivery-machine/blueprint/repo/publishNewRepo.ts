import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { ListenerInvocation, SdmListener } from "../../../handlers/events/delivery/Listener";

export const PublishNewRepo: SdmListener<GitHubRepoRef> = (i: ListenerInvocation<GitHubRepoRef>) => {
    return i.context.messageClient.addressChannels(
        `A new repo was created: \`${i.id.owner}:${i.id.repo}\``, "general");
};
