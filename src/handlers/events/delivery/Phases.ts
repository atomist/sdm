import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import {
    ProjectOperationCredentials,
    TokenCredentials,
} from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { StatusState } from "../../../typings/types";
import { createStatus } from "../../commands/editors/toclient/ghub";

export class Phases {

    constructor(public contexts: string[]) {}

    public setAllToPending(id: GitHubRepoRef, creds: ProjectOperationCredentials): Promise<any> {
        return Promise.all(this.contexts.map(context => setPendingStatus(id, context, creds)));
    }

}

export const ScanContext = "1. code scan";
export const ArtifactContext = "2. create artifact";
export const StagingDeploymentContext = "3. deploy:staging";
export const StagingEndpointContext = "4. starting endpoint:staging";
export const StagingVerifiedContext = "5. verified:staging";

function setPendingStatus(id: GitHubRepoRef, context: string, creds: ProjectOperationCredentials): Promise<any> {
    return createStatus((creds as TokenCredentials).token, id, {
        state: "pending" as StatusState,
        target_url: `${id.apiBase}/${id.owner}/${id.repo}/${id.sha}`,
        context,
    });
}
