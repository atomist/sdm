import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import {
    ProjectOperationCredentials,
    TokenCredentials
} from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { createStatus } from "../../commands/editors/toclient/ghub";
import { StatusState } from "../../../typings/types";

export function setPendingStatuses(id: GitHubRepoRef, creds: ProjectOperationCredentials,
                                   contexts: string[] = ["scan", "artifact", "deployment", "endpoint", "verified"]): Promise<any> {
    return Promise.all(contexts.map(context => setPendingStatus(id, context, creds)));
}

function setPendingStatus(id: GitHubRepoRef, context: string, creds: ProjectOperationCredentials): Promise<any> {
    return createStatus((creds as TokenCredentials).token, id, {
        state: "pending" as StatusState,
        target_url: `${id.apiBase}/${id.owner}/${id.repo}/${id.sha}`,
        context,
    });
}
