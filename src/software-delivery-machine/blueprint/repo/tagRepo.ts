
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { AddressChannels } from "../../../handlers/commands/editors/toclient/addressChannels";

export async function tagRepo(id: GitHubRepoRef, creds: ProjectOperationCredentials, addressChannels: AddressChannels) {
    return addressChannels("Going to tag repo " + JSON.stringify(id));
}
