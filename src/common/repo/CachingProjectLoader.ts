import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { ProjectLoader, ProjectLoadingParameters, WithLoadedProject } from "./ProjectLoader";

import { logger } from "@atomist/automation-client";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import * as fs from "fs";
import * as _ from "lodash";
import { sprintf } from "sprintf-js";
import { promisify } from "util";

export class CachingProjectLoader implements ProjectLoader {

    private cache: Array<{ key: string, project: GitProject }> = [];

    private gets = 0;
    private loads = 0;

    public async doWithProject<T>(params: ProjectLoadingParameters, action: WithLoadedProject<T>): Promise<T> {
        ++this.gets;
        const key = cacheKey(params.id);
        let entry = this.cache.find(e => e.key === key);
        if (!!entry) {
            // Validate it
            const exists = await promisify(fs.exists)(entry.project.baseDir);
            if (!exists) {
                _.remove(this.cache, entry);
                logger.warn("CachingProjectLoader: Invalid cache entry %s", key);
                entry = undefined;
            }
        }

        if (!entry || params.readOnly) {
            const project = await GitCommandGitProject.cloned(params.credentials, params.id);
            ++this.loads;
            entry = {key, project};
            if (params.readOnly) {
                logger.info("Caching project %j", project.id);
                this.cache.push(entry);
            }
        }

        logger.info("CachingProjectLoader: %d gets, %d project loads, %d cache hits",
            this.gets, this.loads, this.gets - this.loads);
        return action(entry.project);
    }

}

function cacheKey(id: RemoteRepoRef) {
    return sprintf("%s:%s:%s@%s", id.owner, id.repo, id.sha, id.url);
}
