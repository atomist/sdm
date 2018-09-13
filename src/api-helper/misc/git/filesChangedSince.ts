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

import {
    execIn,
    logger,
} from "@atomist/automation-client";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { PushFields } from "../../../typings/types";

/**
 * Use git to list the files changed since the given sha
 * or undefined if we cannot determine it
 * @param {GitProject} project
 * @param {PushFields.Fragment} push
 * @return {Promise<string[]>}
 */
export async function filesChangedSince(project: GitProject, push: PushFields.Fragment): Promise<string[] | undefined> {
    // get the number of commits from the after
    const commitCount = push && push.commits ? push.commits.length : 1;
    const sha = push && push.after ? push.after.sha : "HEAD";

    try {
        return await gitDiff(sha, commitCount, project);
    } catch (err) {

        try {
            await execIn(project.baseDir, "git", ["fetch", "--unshallow", "--no-tags"]);

            return await gitDiff(sha, commitCount, project);

        } catch (err) {
            logger.warn("Error diffing project %j since '%s': %s", project.id, sha, err.message);
            try {
                const gs = await project.gitStatus();
                logger.warn("Git status sha '%s' and branch '%s'", gs.sha, gs.branch);
                const timeOfLastChange = await execIn(project.baseDir, "ls", ["-ltr", "."]);
                logger.info("Files with dates: " + timeOfLastChange.stdout);
            } catch (err) {
                logger.warn("Error while trying extra logging: " + err.stack);
            }
            return undefined;
        }
    }
}

async function gitDiff(sha: string, commitCount: number, project: GitProject) {
    const cr = await execIn(project.baseDir, "git", ["diff", "--name-only", `${sha}~${commitCount}`]);
    // stdout is nothing but a list of files, one per line
    logger.debug(`Output from filesChangedSince ${sha} on ${JSON.stringify(project.id)}:\n${cr.stdout}`);
    return cr.stdout.split("\n")
        .filter(n => !!n);
}

export type Mod = "added" | "deleted" | "modified" | "renamed";

export interface Change {
    readonly name: string;
    readonly how: Mod;
}

export class Rename implements Change {

    public readonly how: Mod = "renamed";

    constructor(public name: string, public newName: string) {
    }
}

/**
 * Does a file satisfying this text exist within the set of changed files?
 * @param {string[]} changedFilePaths
 * @param {string[]} test test for the file change
 * @return {boolean}
 */
export function anyFileChangedSuchThat(changedFilePaths: string[], test: (path: string) => boolean): boolean {
    return changedFilePaths.some(test);
}

export function anyFileChangedWithExtension(changedFilePaths: string[], extensions: string[]): boolean {
    return anyFileChangedSuchThat(changedFilePaths,
        path => extensions.some(ext => path.endsWith("." + ext)));
}
