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
import { runCommand } from "@atomist/automation-client/action/cli/commandLine";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";

/**
 * Use git to list the files changed since the given sha
 * or undefined if we cannot determine it
 * @param {GitProject} project
 * @param {string} sha
 * @return {Promise<string[]>}
 */
export async function filesChangedSince(project: GitProject, sha: string): Promise<string[] | undefined> {
    if (!sha) {
        logger.info(`No sha passed in on ${JSON.stringify(project.id)}: Looking for parent sha`);
        return filesChangedSinceParentCommit(project);
    }

    const command = `git diff --name-only ${sha}`;
    try {
        const cr = await runCommand(command, {cwd: project.baseDir});
        // stdout is nothing but a list of files, one per line
        logger.debug(`$Output from filesChangedSince ${sha} on ${JSON.stringify(project.id)}:\n${cr.stdout}`);
        return cr.stdout.split("\n")
            .filter(n => !!n);
    } catch (err) {
        logger.warn("Error diffing project %j since %s: %s", project.id, sha, err.message);
        return undefined;
    }
}

// TODO: we should use the earliest commit in the push, and find its parent. See: https://github.com/atomist/github-sdm/issues/293
// we're using this to list changes for code reactions, and that should include all changes in the push.
export async function filesChangedSinceParentCommit(project: GitProject): Promise<string[] | undefined> {
    try {
        const command = `git show --name-only ${(await project.gitStatus()).sha}^`;
        const cr = await runCommand(command, {cwd: project.baseDir});
        // stdout starts with a line like this:
        // commit acd5f89cb2c3e96fa47ef85b32b2028ea2e045fb (origin/master, origin/HEAD)
        logger.debug(`$Output from filesChangedSinceParent on ${JSON.stringify(project.id)}:\n${cr.stdout}`);
        const matches = /commit ([a-f0-9]{40})/.exec(cr.stdout);
        const sha = matches[1];
        return filesChangedSince(project, sha);
    } catch (err) {
        logger.warn("Error diffing project %j finding parent: %s", project.id, err.message);
        return undefined;
    }
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

export async function changesSince(project: GitProject, sha: string): Promise<string[]> {
    const command = `git diff --name-status ${sha}`;
    const cr = await runCommand(command, {cwd: project.baseDir});
    // stdout is nothing but a list of files, one per line
    logger.debug(`$Output from filesChangedSince ${sha} on ${JSON.stringify(project.id)}:\n${cr.stdout}`);
    if (1 === 1 ) {
        throw new Error("Not yet implemented");
    }
    return cr.stdout.split("\n")
        .filter(n => !!n);
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
