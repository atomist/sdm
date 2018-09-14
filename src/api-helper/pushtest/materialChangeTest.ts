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
import * as minimatch from "minimatch";
import {
    anyFileChangedSuchThat,
    anyFileChangedWithExtension,
    filesChangedSince,
} from "../../../lib/api-helper/misc/git/filesChangedSince";
import {
    DefaultGoalNameGenerator,
} from "../../../lib/api/goal/GoalNameGenerator";
import {
    PushTest,
    pushTest,
} from "../../../lib/api/mapping/PushTest";

/**
 * Options to pass to the IsMaterialChange push test
 */
export interface MaterialChangeOptions {

    /**
     * File extensions to watch for
     */
    extensions?: string[];

    /**
     * File paths to watch for
     */
    files?: string[];

    /**
     * Directory paths to watch for
     * Note: This matches on subdirectories
     */
    directories?: string[];

    /**
     * Glob patters not watch for
     */
    globs?: string[];
}

/**
 * Check if a Push represents a material change.
 *
 * Material changes are changes to files that should trigger certain activity
 * or goals. Often simple changes to MD or html files should not trigger a full CI/CD process.
 */
export function isMaterialChange(options: MaterialChangeOptions = {}): PushTest {
    return pushTest(DefaultGoalNameGenerator.generateName("material-change"), async pci => {

        const changedFiles = await filesChangedSince(pci.project, pci.push);

        if (!changedFiles) {
            logger.info(
                "Cannot determine if change is material on '%s/%s'. Failed to enumerate changed files",
                pci.id.owner,
                pci.id.repo);
            return true;
        }

        logger.debug(`Changed files: '${changedFiles.join(", ")}'`);
        if (anyFileChanged(options, changedFiles)) {
            logger.debug("Change is material on '%s/%s'", pci.id.owner, pci.id.repo);
            return true;
        } else {
            logger.debug("Change is immaterial on '%s/%s'", pci.id.owner, pci.id.repo);
        }
        return false;
    });
}

export function anyFileChanged(options: MaterialChangeOptions = {},
                               changedFiles: string[]): boolean {
    return anyFileChangedWithExtension(changedFiles, options.extensions || []) ||
        anyFileChangedSuchThat(changedFiles,
            path => (options.files || []).some(f => path === f)) ||
        anyFileChangedSuchThat(changedFiles,
            path => (options.directories || []).some(d => path.startsWith(d))) ||
        anyFileChangedSuchThat(changedFiles,
            path => (options.globs || []).some(g => minimatch(path, g)));
}
