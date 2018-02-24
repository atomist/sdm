import { BranchCommit } from "@atomist/automation-client/operations/edit/editModes";
import { Project } from "@atomist/automation-client/project/Project";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { createStatus, Status } from "./ghub";
import {
    ProjectOperationCredentials,
    TokenCredentials
} from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { logger } from "@atomist/automation-client";

/**
 * Create a new branch, setting the necessary status
 */
export class NewBranchWithStatus implements BranchCommit {

    constructor(public branch: string,
                public message: string,
                private creds: ProjectOperationCredentials,
                private status: Status) {
        logger.info("Created NewBranchWithStatus: %j", this);
    }

    public async afterPersist(p: Project): Promise<any> {
        const gitStatus = await (p as GitProject).gitStatus();
        const sha = gitStatus.sha;
        logger.info("Setting status %j on sha %s for %j", this.status, sha, p.id);
        if (!sha) {
            throw new Error("Sha is not set");
        }
        return createStatus((this.creds as TokenCredentials).token,
            {
                ...p.id,
                sha,
            } as GitHubRepoRef,
            this.status);
    }
}
