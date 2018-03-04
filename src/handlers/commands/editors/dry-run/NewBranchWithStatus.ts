import { logger } from "@atomist/automation-client";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import {
    ProjectOperationCredentials,
    TokenCredentials,
} from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { BranchCommit } from "@atomist/automation-client/operations/edit/editModes";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { Project } from "@atomist/automation-client/project/Project";
import { createStatus, Status } from "../../../../util/github/ghub";

/**
 * Create a new branch, setting a GitHub commit status
 */
export class NewBranchWithStatus implements BranchCommit {

    constructor(public branch: string,
                public message: string,
                private creds: ProjectOperationCredentials,
                private status: Status) {
        logger.info("Created NewBranchWithStatus: %j", this);
    }

    public async afterPersist(p: Project): Promise<any> {
        try {
            const gitStatus = await (p as GitProject).gitStatus();
            const sha = gitStatus.sha;
            if (!sha) {
                throw new Error("Sha is not available");
            }
            logger.info("Setting status %j on sha %s for %j", this.status, sha, p.id);
            return createStatus((this.creds as TokenCredentials).token, {
                    ...p.id,
                    sha,
                } as GitHubRepoRef,
                this.status);
        } catch (err) {
            logger.warn("Unable to get git status for %j. Possibly a deleted repo", p.id);
        }
    }
}
