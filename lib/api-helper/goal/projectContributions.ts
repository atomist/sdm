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
    GitProject,
    logger,
    projectUtils,
} from "@atomist/automation-client";
import * as path from "path";

/**
 * Dynamically load contributions from the provided project
 *
 * Contributions can be AutofixRegistrations or CodeInspections.
 */
export async function loadProjectContributions<T>(project: GitProject,
                                                  subdirectory: string,
                                                  variable: string): Promise<T[]> {
    require("ts-node").register({ skipProject: true });

    const visited: string[] = [];

    return (await projectUtils.gatherFromFiles<T>(
        project,
        [`**/${subdirectory}/*.ts`, `**/${subdirectory}/*.js`],
        async f => {
            if (f.path.endsWith(".d.ts") || f.path.endsWith(".d.js")) {
                return undefined;
            }
            const baseName = f.path.replace(/\.ts/, "").replace(/\.js/, "");
            if (visited.includes(baseName)) {
                return undefined;
            } else {
                visited.push(baseName);
            }

            try {
                const content = (require(path.join(project.baseDir, f.path)))[variable];
                if (!!content) {
                    return content as T;
                } else {
                    logger.debug("Project file '%s' didn't export '%s' variable", f.path, variable);
                }
            } catch (e) {
                logger.warn("Failed to load project contribution from '%s': %s", f.path, e.message);
            }
            return undefined;

        })).filter(r => !!r);
}
