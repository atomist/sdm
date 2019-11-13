/*
 * Copyright © 2019 Atomist, Inc.
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

import {
    CloneOptions,
    GitCommandGitProject,
    logger,
} from "@atomist/automation-client";
import { DefaultDirectoryManager } from "@atomist/automation-client/lib/project/git/GitCommandGitProject";
import {
    CloneDirectoryInfo,
    DirectoryManager,
} from "@atomist/automation-client/lib/spi/clone/DirectoryManager";
import * as fs from "fs-extra";
import {
    ProjectLoader,
    ProjectLoadingParameters,
    WithLoadedProject,
} from "../../spi/project/ProjectLoader";

/**
 * Non caching ProjectLoader that uses a separate clone for each project accessed
 */
export const CloningProjectLoader: ProjectLoader = {
    async doWithProject(coords: ProjectLoadingParameters, action: WithLoadedProject<any>): Promise<any> {
        // coords.depth is deprecated; populate it for backwards compatibility
        // tslint:disable-next-line:deprecation
        const cloneOptions = coords.cloneOptions ? coords.cloneOptions : { depth: coords.depth };
        // If we get a cloneDir we need to wrap the DirectoryManager to return the directory
        const directoryManager = !!coords.cloneDir ? new ExplicitDirectoryManager(coords.cloneDir) : DefaultDirectoryManager;
        const p = await GitCommandGitProject.cloned(coords.credentials, coords.id, cloneOptions, directoryManager);
        if (p.id.sha === "HEAD") {
            const gs = await p.gitStatus();
            p.id.sha = gs.sha;
        }
        if (!!coords.readOnly) {
            (p as any).shouldCache = true;
        } else {
            (p as any).shouldCache = false;
        }
        return action(p);
    },
};

class ExplicitDirectoryManager implements DirectoryManager {

    constructor(private readonly cloneDir: string) {
    }

    public async directoryFor(owner: string, repo: string, branch: string, opts: CloneOptions): Promise<CloneDirectoryInfo> {
        await fs.emptyDir(this.cloneDir);
        return {
            path: this.cloneDir,
            release: () => this.cleanup(this.cloneDir, opts.keep),
            invalidate: () => Promise.resolve(),
            transient: opts.keep === false,
            provenance: "explicit-directory",
            type: "empty-directory",
        };
    }

    private async cleanup(p: string, keep: boolean): Promise<void> {
        if (keep) {
            return;
        }
        try {
            await fs.remove(p);
        } catch (e) {
            logger.warn(`Failed to remove '${p}': ${e.message}`);
        }
    }
}
