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

import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { ProjectLoader } from "../../spi/project/ProjectLoader";

/**
 * Non caching ProjectLoader that uses a separate clone for each project accessed
 */
export const CloningProjectLoader: ProjectLoader = {
    async doWithProject(coords, action) {
        // This is breaking old internal code but we need the branch, so this error gives us an opportunity
        // to fix all lingering cloning issues
        if (!coords.id.branch) {
            throw new Error(`Repository reference '${JSON.stringify(coords.id)}' is missing required branch`);
        }
        const p = await GitCommandGitProject.cloned(coords.credentials, coords.id, { depth: coords.depth });
        return action(p);
    },
};
