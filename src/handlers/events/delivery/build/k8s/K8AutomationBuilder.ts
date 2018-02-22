import {success} from "@atomist/automation-client";
import {GitHubRepoRef} from "@atomist/automation-client/operations/common/GitHubRepoRef";
import {ProjectOperationCredentials, TokenCredentials} from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import {RemoteRepoRef} from "@atomist/automation-client/operations/common/RepoId";
import {AddressChannels} from "../../../../commands/editors/toclient/addressChannels";
import {createStatus} from "../../../../commands/editors/toclient/ghub";

const K8AutomationBuildContext = "build/atomist/k8s";
/**
 * Upon recognizing a plan to create an artifact, send a message to k8-automation to request a build.
 * k8-automation will trigger a build for this commit in Google Container Builder.
 * When that is complete, it will send an ImageLinked event, and that means our artifact has been created.
 *
 * The message to k8-automation takes the form of a pending GitHub status.
 */
export function initiatek8AutomationBuild(creds: ProjectOperationCredentials,
                                          id: RemoteRepoRef,
                                          ac: AddressChannels,
                                          team: string): Promise<any> {

    return createStatus((creds as TokenCredentials).token, id as GitHubRepoRef, {
        context: K8AutomationBuildContext,
        state: "pending",
        description: "Requested build in k8-automation",
        target_url: undefined,
    }).then(success);
}
