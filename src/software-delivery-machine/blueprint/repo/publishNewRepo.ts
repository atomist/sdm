import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { AddressChannels } from "../../../handlers/commands/editors/toclient/addressChannels";
import { NewRepoWithCodeAction } from "../../../handlers/events/repo/OnFirstPushToRepo";
import { HandlerContext } from "@atomist/automation-client";

export function publishNewRepo(id: GitHubRepoRef,
                               creds: ProjectOperationCredentials,
                               addressChannels: AddressChannels,
                               ctx: HandlerContext): Promise<any> {
    return ctx.messageClient.addressChannels(`A new repo was created: \`${id.owner}:${id.repo}\``, "general");
}