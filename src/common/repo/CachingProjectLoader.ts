import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { ProjectLoader, ProjectLoadingParameters, WithLoadedProject } from "./ProjectLoader";

import { logger } from "@atomist/automation-client";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import * as fs from "fs";
import { sprintf } from "sprintf-js";
import { promisify } from "util";

/**
 * Simple caching implementation of ProjectLoader
 */
export class CachingProjectLoader implements ProjectLoader {

    private cache: { [key: string]: GitProject } = {};

    private gets = 0;
    private loads = 0;

    /**
     * @return {number} the number of projects requested
     */
    get requested() {
        return this.gets;
    }

    /**
     * @return {number} the number of projects loaded
     */
    get loaded() {
        return this.loads;
    }

    public async doWithProject<T>(params: ProjectLoadingParameters, action: WithLoadedProject<T>): Promise<T> {
        ++this.gets;

        if (!params.readOnly) {
            logger.warn("CachingProjectLoader: Forcing fresh clone for non readonly use of %j", params.id);
            const p = await GitCommandGitProject.cloned(params.credentials, params.id);
            return action(p);
        }

        const key = cacheKey(params.id);
        let project = this.cache[key];
        if (!!project) {
            // Validate it, as the directory may have been cleaned up
            const exists = await promisify(fs.exists)(project.baseDir);
            if (!exists) {
                this.cache[key] = undefined;
                logger.warn("CachingProjectLoader: Invalid cache entry %s", key);
                project = undefined;
            }
        }

        if (!project) {
            project = await GitCommandGitProject.cloned(params.credentials, params.id);
            ++this.loads;
            logger.info("Caching project %j", project.id);
            this.cache[key] = project;
        }

        logger.info("CachingProjectLoader: %d gets, %d project loads, %d cache hits",
            this.requested, this.loaded, this.requested - this.loaded);
        return action(project);
    }

}

function cacheKey(id: RemoteRepoRef) {
    return sprintf("%s:%s:%s@%s", id.owner, id.repo, id.sha, id.url);
}
