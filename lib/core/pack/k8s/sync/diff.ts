/*
 * Copyright © 2020 Atomist, Inc.
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

import { LocalProject } from "@atomist/automation-client/lib/project/local/LocalProject";
import { execPromise } from "@atomist/automation-client/lib/util/child_process";
import { SdmGoalEvent } from "../../../../api/goal/SdmGoalEvent";
import { ProgressLog } from "../../../../spi/log/ProgressLog";
import { ChangeType } from "./change";

/**
 * Glob pattern used to identify Kubernetes spec files in a
 * repository.  It only matched JSON and YAML files at the root of the
 * repository.
 */
export const k8sSpecGlob = "*.@(json|yaml|yml)";
/**
 * Regular expression used to identify Kubernetes spec files in a
 * repository.  It only matched JSON and YAML files at the root of the
 * repository.
 */
export const k8sSpecRegExp = /^[^/]+\.(?:json|ya?ml)$/;

/** Container for changes in a commit. */
export interface PushDiff {
    /** Whether to apply or delete the change. */
    change: ChangeType;
    /** Path to spec relative to the project base directory. */
    path: string;
    /** Git SHA of change. */
    sha: string;
}

/**
 * Determine all changed Kubernetes resource spec files in a push.  A
 * file is considered a Kubernetes resource spec if it matches
 * [[k8sSpecRegExp]].  Changes are returned in commit order, with the
 * commit order unchanged from the push event sent by cortex, which it
 * typically chronologically with the oldest commit first.  Within a
 * commit, the changes are sorted first by operation, with deletes
 * before applies, and then by path using `sort(localCompare)`.
 * Deletes are sorted first because renames are processed as adds and
 * deletes and we want to avoid a rename resulting in a resource being
 * deleted.  If you want to control the order of operations, spread
 * the operations across multiple commits in the same push.
 *
 * @param project project with the changed Kubernetes resource specs.
 * @param push git push with changes
 * @param tag git commit message tag indicating automated commits that should be ignored
 * @param log goal execution progress log
 * @return sorted resource spec changes
 */
export async function diffPush(project: LocalProject, push: SdmGoalEvent["push"], tag: string, log: ProgressLog): Promise<PushDiff[]> {
    const changes: PushDiff[] = [];
    const commits = push.commits.filter(c => !c.message.includes(tag));
    for (const commit of commits) {
        try {
            const sha = commit.sha;
            const args = ["diff", "-z", "--no-renames", "--name-status", "--diff-filter=ADM", `${sha}~1`, sha, "--"];
            const opts = { cwd: project.baseDir };
            const diffResult = await execPromise("git", args, opts);
            const newChanges = parseNameStatusDiff(sha, diffResult.stdout);
            changes.push(...newChanges);
        } catch (e) {
            e.message = `Failed to diff commit ${commit.sha}, skipping: ${e.message}`;
            log.write(e.message);
        }
    }
    return changes;
}

/**
 * Convert output of `git diff -z --name-status` to a list of file
 * changes.  The returned changes are sorted by file path.
 *
 * @param sha git commit SHA
 * @param diff output from git diff command
 * @return sorted resource spec changes
 */
export function parseNameStatusDiff(sha: string, diff: string): PushDiff[] {
    const changes: PushDiff[] = [];
    const diffContent = diff.trim().replace(/\0$/, "");
    if (!diffContent) {
        return changes;
    }
    const fields = diffContent.split("\0");
    for (let i = 0; i < fields.length; i += 2) {
        const f = fields[i];
        if (!f) {
            throw new Error(`Empty git diff status`);
        }
        const path = fields[i + 1];
        if (!path) {
            throw new Error(`Missing path from git diff status: ${f}`);
        }
        if (!k8sSpecRegExp.test(path)) {
            continue;
        }
        if (f === "A" || f.startsWith("M")) {
            changes.push({ change: "apply", path, sha });
        } else if (f === "D") {
            changes.push({ change: "delete", path, sha });
        } else {
            throw new Error(`Unexpected git diff status for path '${path}' in commit ${sha}: ${f}`);
        }
    }
    return changes.sort(compareDiff);
}

/**
 * Sort "delete" changes before "apply".  Within each category, sort
 * by path.
 */
function compareDiff(a: PushDiff, b: PushDiff): number {
    if (a.change === b.change) {
        return a.path.localeCompare(b.path);
    } else if (a.change === "delete") {
        return -1;
    } else {
        return 1;
    }
}
