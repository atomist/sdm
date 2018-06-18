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

import { ProjectLoader, ProjectLoadingParameters, WithLoadedProject } from "../../spi/project/ProjectLoader";

import { logger } from "@atomist/automation-client";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import * as fs from "fs";
import { promisify } from "util";
import { cacheKeyForSha } from "./support/cacheKey";
import { LruCache } from "./support/LruCache";
import { SimpleCache } from "./support/SimpleCache";

/**
 * Caching implementation of ProjectLoader
 */
export class CachingProjectLoader implements ProjectLoader {

    private readonly cache: SimpleCache<GitProject>;

    // TODO should be expressed in terms of another ProjectLoader, not cloning

    constructor(maxEntries: number = 20) {
        this.cache = new LruCache<GitProject>(maxEntries);
    }

    public async doWithProject<T>(params: ProjectLoadingParameters, action: WithLoadedProject<T>): Promise<T> {
        if (!params.readOnly) {
            logger.info("CachingProjectLoader: Forcing fresh clone for non readonly use of %j", params.id);
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
