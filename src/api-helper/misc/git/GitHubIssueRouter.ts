import { ProjectOperationCredentials, TokenCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { Issue, raiseIssue } from "@atomist/automation-client/util/gitHub";
import { IssueRouter } from "../../../spi/issue/IssueRouter";

/**
 * GitHub implementation of IssueRouter
 */
export class GitHubIssueRouter implements IssueRouter {

    public async raiseIssue(credentials: ProjectOperationCredentials,
                            id: RemoteRepoRef,
                            issue: Issue): Promise<any> {
        return raiseIssue((credentials as TokenCredentials).token, id, issue);
    }

}
