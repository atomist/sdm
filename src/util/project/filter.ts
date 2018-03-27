/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { logger } from "@atomist/automation-client";
import { LocalProject } from "@atomist/automation-client/project/local/LocalProject";
import { NodeFsLocalProject } from "@atomist/automation-client/project/local/NodeFsLocalProject";
import { doWithFiles } from "@atomist/automation-client/project/util/projectUtils";
import * as fs from "fs";
import * as tmp from "tmp-promise";
import { promisify } from "util";

/**
 * Create a local copy on disk of this project that has only the relevant files
 * in it
 * @param {LocalProject} p
 * @param {string[]} globs to copy
 * @return {Promise<LocalProject>}
 */
export async function filtered(p: LocalProject, globs: string[]): Promise<LocalProject> {
    if (!globs) {
        logger.debug("Cannot filter project %j: No globs specified", p.id);
        return p;
    }
    const tmpDir = tmp.dirSync({unsafeCleanup: true}).name;
    logger.info("Filtered project %j at %d to %s", p.id, p.baseDir, tmpDir);
    await Promise.all(globs.map(glob =>
        doWithFiles(p, glob, async f => {
            await promisify(fs.copyFile)(
                p.baseDir + "/" + f.path,
                tmpDir + "/" + f.path);
        })));
    return new NodeFsLocalProject(p.id, tmpDir);
}
