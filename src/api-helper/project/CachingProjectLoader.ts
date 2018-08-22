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
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import * as fs from "fs-extra";
import { promisify } from "util";
import {
    ProjectLoader,
    ProjectLoadingParameters,
    WithLoadedProject,
} from "../../spi/project/ProjectLoader";
import { CloningProjectLoader } from "./cloningProjectLoader";
import { cacheKeyForSha } from "./support/cacheKey";
import { LruCache } from "./support/LruCache";
import { SimpleCache } from "./support/SimpleCache";

/**
 * Caching implementation of ProjectLoader
 */
export class CachingProjectLoader implements ProjectLoader {

    private readonly cache: SimpleCache<GitProject>;

    public async doWithProject<T>(params: ProjectLoadingParameters, action: WithLoadedProject<T>): Promise<T> {
        if (!params.readOnly) {
            logger.info("Forcing fresh clone for non readonly use of '%j'", params.id);
            const p = await save(this.delegate, params);
            return action(p)
                .then(result => {
                    cleanUp(p);
                    return result;
                });
        }

        logger.debug("Attempting to reuse clone for readonly use of '%j'", params.id);
        const key = cacheKeyForSha(params.id);
        let project = this.cache.get(key);
        if (!!project) {
            // Validate it, as the directory may have been cleaned up
            try {
                await promisify(fs.access)(project.baseDir);
            } catch {
                this.cache.evict(key);
                logger.warn("Invalid cache entry '%s'", key);
                project = undefined;
            }
        }

        if (!project) {
            project = await save(this.delegate, params);
            logger.info("Caching project '%j'", project.id);
            this.cache.put(key, project);
        }

        logger.debug("About to invoke action. Cache stats: %j", this.cache.stats);
        return action(project);
    }

    constructor(
        private readonly delegate: ProjectLoader = CloningProjectLoader,
        maxEntries: number = 20) {
        this.cache = new LruCache<GitProject>(maxEntries, cleanUp);
    }
}

function cleanUp(p: GitProject): void {
    logger.debug(`Evicting project '%j'`, p.id);
    if (p.baseDir && fs.accessSync(p.baseDir)) {
        try {
            fs.removeSync(p.baseDir);
        } catch (err) {
            logger.warn(err);
        }
    }
}

export function save(pl: ProjectLoader, params: ProjectLoadingParameters): Promise<GitProject> {
    let p: GitProject;
    return pl.doWithProject(params, async loaded => {
        p = loaded;
    }).then(() => p);
}
