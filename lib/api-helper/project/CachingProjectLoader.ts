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
import { registerShutdownHook } from "@atomist/automation-client/lib/internal/util/shutdown";
import { GitProject } from "@atomist/automation-client/lib/project/git/GitProject";
import * as fs from "fs-extra";
import * as sha from "sha-regex";
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
    private readonly deleteOnExit: string[] = [];

    public async doWithProject<T>(params: ProjectLoadingParameters, action: WithLoadedProject<T>): Promise<T> {
        // read-only == false means the consumer is going to make changes; don't cache such projects
        if (!params.readOnly) {
            logger.info("Forcing fresh clone for non readonly use of '%j'", params.id);
            return this.saveAndRunAction<T>(this.delegate, params, action);
        }
        // Caching projects by branch references is wrong as the branch might change; give out new versions
        if (!sha({ exact: true }).test(params.id.sha)) {
            logger.info("Forcing fresh clone for branch use of '%j'", params.id);
            return this.saveAndRunAction<T>(this.delegate, params, action);
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
            logger.info("Caching project '%j' at '%s'", project.id, project.baseDir);
            this.cache.put(key, project);
        }

        logger.debug("About to invoke action. Cache stats: %j", this.cache.stats);
        return action(project);
    }

    /**
     * Save project and run provided WithLoadedProject action on it.
     * @param delegate
     * @param params
     * @param action
     */
    private async saveAndRunAction<T>(delegate: ProjectLoader,
                                      params: ProjectLoadingParameters,
                                      action: WithLoadedProject): Promise<T> {
        const p = await save(delegate, params);
        if (params.context && params.context.lifecycle) {
            params.context.lifecycle.registerDisposable(async () => this.cleanUp(p.baseDir, "disposal"));
        } else {
            // schedule a cleanup timer but don't block the Node.js event loop for this
            setTimeout(() => this.cleanUp(p.baseDir, "timeout"), 10000).unref();
            // also store a reference to this project to be deleted when we exit
            this.deleteOnExit.push(p.baseDir);
        }
        return action(p);
    }

    /**
     * Eviction callback to clean up file system resources.
     * @param dir
     * @param reason
     */
    private cleanUp(dir: string, reason: "timeout" | "disposal" | "eviction" | "shutdown"): void {
        if (dir && fs.existsSync(dir)) {
            if (reason === "timeout") {
                logger.debug(`Deleting project '%s' because a timeout passed`, dir);
            } else {
                logger.debug(`Deleting project '%s' because %s was triggered`, dir, reason);
            }
            try {
                fs.removeSync(dir);
                const ix = this.deleteOnExit.indexOf(dir);
                if (ix >= 0) {
                    this.deleteOnExit.slice(ix, 1);
                }
            } catch (err) {
                logger.warn(err);
            }
        }
    }

    constructor(
        private readonly delegate: ProjectLoader = CloningProjectLoader,
        maxEntries: number = 20) {
        this.cache = new LruCache<GitProject>(maxEntries, p => this.cleanUp(p.baseDir, "eviction"));

        registerShutdownHook(async () => {
            if (this.deleteOnExit.length > 0) {
                logger.debug("Deleting cached projects");
            }
            this.deleteOnExit.forEach(p => {
                this.cleanUp(p, "shutdown");
            });
            return 0;
        });
    }
}

/**
 * Delegate to the underlying ProjectLoader to load the project.
 * @param pl
 * @param params
 */
export function save(pl: ProjectLoader, params: ProjectLoadingParameters): Promise<GitProject> {
    let p: GitProject;
    return pl.doWithProject(params, async loaded => {
        p = loaded;
    }).then(() => p);
}
