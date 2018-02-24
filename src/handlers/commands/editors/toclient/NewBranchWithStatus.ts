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

    private sha: string;

    constructor(public branch: string,
                public message: string,
                private creds: ProjectOperationCredentials,
                private status: Status) {
        logger.info("Created NewBranchWithStatus: %j", this);
    }

    public async beforePersist(p: Project): Promise<any> {
        const gp = p as GitProject;
        const status = await gp.gitStatus();
        this.sha = status.sha;
    }

    public afterPersist(p: Project): Promise<any> {
        if (!this.sha) {
            throw new Error("Sha is not set");
        }
        return createStatus((this.creds as TokenCredentials).token,
            {
                ...p.id,
                sha: this.sha,
            } as GitHubRepoRef,
            this.status);
    }
}
