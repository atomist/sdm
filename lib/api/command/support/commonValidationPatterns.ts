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

import { BaseParameter } from "@atomist/automation-client";

/**
 * Validation pattern for semantic versions
 * @type {{displayName: string; description: string; pattern: RegExp; validInput: string; minLength: number; maxLength: number}}
 */
export const SemVerRegExp: Partial<BaseParameter> = {
    displayName: "Version",
    description: "version of the project, e.g., 1.2.3-SNAPSHOT",
    // tslint:disable-next-line:max-line-length
    pattern: /^v?(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:[1-9]\d*|\d*[-A-Za-z][-A-Za-z\d]*)(?:\.(?:[1-9]\d*|\d*[-A-Za-z][-A-Za-z\d]*))*)?(?:\+[-A-Za-z\d]+(?:\.[-A-Za-z\d]+)*)?$/,
    validInput: "a valid semantic version, http://semver.org",
    minLength: 1,
    maxLength: 50,
};

export const GitHubNameRegExp: Partial<BaseParameter> = {
    displayName: "GitHub name",
    description: "valid GitHub name",
    pattern: /^[-.\w]+$/,
    validInput: "a valid GitHub name which consists of alphanumeric, ., -, and _ characters",
};

export const GitBranchRegExp: Partial<BaseParameter> = {
    displayName: "Branch",
    description: "initial version of the project, e.g., 1.2.3-SNAPSHOT",
    // not perfect, but pretty good
    pattern: /^\w(?:[./]?[-\w])*$/,
    validInput: "a valid Git branch name, see" +
        " https://www.kernel.org/pub/software/scm/git/docs/git-check-ref-format.html",
};

export const GitShaRegExp: Partial<BaseParameter> = {
    displayName: "Sha",
    description: "valid Git SHA",
    pattern: /^[0-9a-f]{40}$/,
    validInput: "40 hex digits, lowercase",
};
