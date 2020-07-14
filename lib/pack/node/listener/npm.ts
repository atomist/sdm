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

import { GitProject } from "@atomist/automation-client/lib/project/git/GitProject";
import { spawnLog } from "../../../api-helper/misc/child_process";
import { ExecuteGoalResult } from "../../../api/goal/ExecuteGoalResult";
import {
    GoalInvocation,
    GoalProjectListenerEvent,
    GoalProjectListenerRegistration,
} from "../../../api/goal/GoalInvocation";
import { SdmGoalEvent } from "../../../api/goal/SdmGoalEvent";
import { readSdmVersion } from "../../../core/delivery/build/local/projectVersioner";
import { cachePut, cacheRestore } from "../../../core/goal/cache/goalCaching";
import { npmSpawnLogOptions } from "../npm/spawn";
import { IsNode } from "../pushtest/nodePushTests";

/**
 * Update package files with pre-release version for the provided goal
 * invocation.
 *
 * @param p Project to modify package files in
 * @param gi SDM goal invocation triggering this preparation
 * @return Success or failure
 */
export async function npmVersionPreparation(p: GitProject, gi: GoalInvocation): Promise<ExecuteGoalResult> {
    const goalEvent = gi.goalEvent;
    const repo = goalEvent.repo;
    const version = await readSdmVersion(
        repo.owner,
        repo.name,
        repo.providerId,
        goalEvent.sha,
        goalEvent.branch,
        gi.context,
    );
    return spawnLog("npm", ["version", "--no-git-tag-version", version], npmSpawnLogOptions(p, gi.progressLog));
}

/**
 * Install Node.js dependencies using NPM, running `npm install` or
 * `npm ci`, as appropriate.
 *
 * @param p Project to install dependencies for
 * @param gi SDM goal invocation triggering this preparation
 * @return Success or failure
 */
export async function npmInstallPreparation(p: GitProject, gi: GoalInvocation): Promise<ExecuteGoalResult> {
    const hasPackageLock = await p.hasFile("package-lock.json");
    const installCmd = hasPackageLock ? "ci" : "install";
    return spawnLog("npm", [installCmd], npmSpawnLogOptions(p, gi.progressLog));
}

/**
 * Run NPM package compile script, if present.
 *
 * @param p Project to run compile script in
 * @param gi SDM goal invocation triggering this preparation
 * @return Success or failure
 */
export async function npmCompilePreparation(p: GitProject, gi: GoalInvocation): Promise<ExecuteGoalResult> {
    return spawnLog("npm", ["run", "--if-present", "compile"], npmSpawnLogOptions(p, gi.progressLog));
}

/**
 * Project listener that runs [[npmVersionPreparation]] before executing goal.
 */
export const NpmVersionProjectListener: GoalProjectListenerRegistration = {
    events: [GoalProjectListenerEvent.before],
    listener: npmVersionPreparation,
    name: "npm version",
    pushTest: IsNode,
};

/**
 * Project listener that runs [[npmInstallPreparation]] before executing goal.
 */
export const NpmInstallProjectListener: GoalProjectListenerRegistration = {
    events: [GoalProjectListenerEvent.before],
    listener: npmInstallPreparation,
    name: "npm install",
    pushTest: IsNode,
};

/**
 * Project listener that runs [[npmCompilePreparation]] before executing goal.
 */
export const NpmCompileProjectListener: GoalProjectListenerRegistration = {
    events: [GoalProjectListenerEvent.before],
    listener: npmCompilePreparation,
    name: "npm compile",
    pushTest: IsNode,
};

/**
 * Return unique classifier for repo and SHA.
 */
function npmCacheClassifier(goalEvent: SdmGoalEvent, tail: string): string {
    return `${goalEvent.repo.owner}_${goalEvent.repo.name}_${goalEvent.sha}_${tail}`;
}

const nodeModulesCacheClassifier = "node_modules";

/**
 * Listener that stores the `node_modules` directory in the configured
 * cache after a goal invocation.
 */
export function npmNodeModulesCachePut(goalEvent: SdmGoalEvent): GoalProjectListenerRegistration {
    const classifier = npmCacheClassifier(goalEvent, nodeModulesCacheClassifier);
    return cachePut({
        entries: [{ classifier, pattern: { directory: "node_modules" } }],
        pushTest: IsNode,
    });
}

/**
 * Install Node.js dependencies using NPM and cache the results.  If
 * install the dependencies fails, nothing is cached.
 *
 * @param p Project to install dependencies for
 * @param gi SDM goal invocation triggering this preparation
 * @param event SDM goal event triggering this preparation
 * @return Success or failure
 */
async function cachingNpmInstallPreparation(
    p: GitProject,
    gi: GoalInvocation,
    event: GoalProjectListenerEvent,
): Promise<ExecuteGoalResult> {
    const log = gi.progressLog;
    const prepResult = await npmInstallPreparation(p, gi);
    if (prepResult.code !== 0) {
        log.write(`Failed to install dependencies using npm: ${prepResult.message}`);
        return prepResult;
    }
    try {
        await npmNodeModulesCachePut(gi.goalEvent).listener(p, gi, event);
    } catch (e) {
        log.write(`Failed to cache node_modules: ${e.message}`);
    }
    return prepResult;
}

/**
 * Listener that restores the `node_modules` directory from the
 * configured cache before a goal invocation.
 */
export function npmNodeModulesCacheRestore(goalEvent: SdmGoalEvent): GoalProjectListenerRegistration {
    const classifier = npmCacheClassifier(goalEvent, nodeModulesCacheClassifier);
    return cacheRestore({
        entries: [{ classifier }],
        onCacheMiss: {
            name: "cache-miss-npm-install",
            listener: cachingNpmInstallPreparation,
        },
        pushTest: IsNode,
    });
}

const typescriptCompileCacheClassifier = "ts-compile";

/**
 * Listener that stores the output from TypeScript compilation in the
 * configured cache after a goal invocation.
 */
export function typeScriptCompileCachePut(goalEvent: SdmGoalEvent): GoalProjectListenerRegistration {
    return cachePut({
        entries: [
            {
                classifier: npmCacheClassifier(goalEvent, typescriptCompileCacheClassifier),
                pattern: {
                    globPattern: [
                        "*.{d.ts,js}{,.map}",
                        "!(node_modules)/**/*.{d.ts,js}{,.map}",
                        "lib/typings/types.ts",
                        "git-info.json",
                    ],
                },
            },
        ],
        pushTest: IsNode,
    });
}

/**
 * Use NPM to compile sources and cache the results.  If compilation
 * fails, nothing is cached.
 *
 * @param p Project to run compile in
 * @param gi SDM goal invocation triggering this preparation
 * @param event SDM goal event triggering this preparation
 * @return Success or failure
 */
async function cachingNpmCompilePreparation(
    p: GitProject,
    gi: GoalInvocation,
    event: GoalProjectListenerEvent,
): Promise<ExecuteGoalResult> {
    const log = gi.progressLog;
    const prepResult = await npmCompilePreparation(p, gi);
    if (prepResult.code !== 0) {
        log.write(`Failed to compile using npm: ${prepResult.message}`);
        return prepResult;
    }
    try {
        await typeScriptCompileCachePut(gi.goalEvent).listener(p, gi, event);
    } catch (e) {
        log.write(`Failed to cache compiled files: ${e.message}`);
    }
    return prepResult;
}

/**
 * Listener that restores the output from TypeScript compilation from
 * the configured cache before a goal invocation.
 */
export function typeScriptCompileCacheRestore(goalEvent: SdmGoalEvent): GoalProjectListenerRegistration {
    return cacheRestore({
        entries: [{ classifier: npmCacheClassifier(goalEvent, typescriptCompileCacheClassifier) }],
        onCacheMiss: {
            name: "cache-miss-typescript-compile",
            listener: cachingNpmCompilePreparation,
        },
        pushTest: IsNode,
    });
}
