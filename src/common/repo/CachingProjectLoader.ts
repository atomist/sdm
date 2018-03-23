import { ProjectLoader, ProjectLoadingParameters, WithLoadedProject } from "./ProjectLoader";

import { logger } from "@atomist/automation-client";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import * as fs from "fs";
import { promisify } from "util";
import { cacheKeyForSha } from "../../util/misc/cacheKey";
import { LruCache } from "../../util/misc/LruCache";
import { SimpleCache } from "../../util/misc/SimpleCache";

/**
 * Simple caching implementation of ProjectLoader
 */
export class CachingProjectLoader implements ProjectLoader {

    private cache: SimpleCache<GitProject>;

    constructor(maxEntries: number = 20) {
        this.cache = new LruCache<GitProject>(maxEntries);
    }

    public async doWithProject<T>(params: ProjectLoadingParameters, action: WithLoadedProject<T>): Promise<T> {
        if (!params.readOnly) {
            logger.warn("CachingProjectLoader: Forcing fresh clone for non readonly use of %j", params.id);
            const p = await GitCommandGitProject.cloned(params.credentials, params.id);
            return action(p);
        }

        logger.debug("CachingProjectLoader: Hoping to reuse clone for readonly use of %j", params.id);
        const key = cacheKeyForSha(params.id);
        let project = this.cache.get(key);
        if (!!project) {
            // Validate it, as the directory may have been cleaned up
            try {
                await promisify(fs.access)(project.baseDir);
            } catch {
                this.cache.evict(key);
                logger.warn("CachingProjectLoader: Invalid cache entry %s", key);
                project = undefined;
            }
        }

        if (!project) {
            project = await GitCommandGitProject.cloned(params.credentials, params.id);
            logger.info("Caching project %j", project.id);
            this.cache.put(key, project);
        }

        logger.info("CachingProjectLoader: About to invoke action. Cache stats: %j", this.cache.stats);
        return action(project);
    }

}
