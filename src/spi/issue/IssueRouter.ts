import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { Issue } from "@atomist/automation-client/util/gitHub";

/**
 * Implemented by types that can raise issues
 */
export interface IssueRouter {

    raiseIssue(credentials: ProjectOperationCredentials,
               id: RemoteRepoRef,
               issue: Issue): Promise<any>;
}
