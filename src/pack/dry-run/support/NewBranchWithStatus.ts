/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { logger } from "@atomist/automation-client";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import {
    ProjectOperationCredentials,
} from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { BranchCommit } from "@atomist/automation-client/operations/edit/editModes";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { Project } from "@atomist/automation-client/project/Project";
import { createStatus, Status } from "../../../util/github/ghub";

/**
 * Create a new branch, setting a GitHub commit status
 */
export class NewBranchWithStatus implements BranchCommit {

    constructor(public branch: string,
                public message: string,
                private readonly creds: ProjectOperationCredentials,
                private readonly status: Status) {
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
            return createStatus(this.creds, {
                    ...p.id,
                    sha,
                } as GitHubRepoRef,
                this.status);
        } catch (err) {
            logger.warn("Unable to get git status for %j. Possibly a deleted repo", p.id);
        }
    }
}
