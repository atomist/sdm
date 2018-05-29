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

import { BaseParameter } from "@atomist/automation-client/internal/metadata/decoratorSupport";

/**
 * Validation pattern for semantic versions
 * @type {{displayName: string; description: string; pattern: RegExp; validInput: string; minLength: number; maxLength: number}}
 */
export const SemVerRegExp: Partial<BaseParameter> = {
    displayName: "Version",
    description: "initial version of the project, e.g., 1.2.3-SNAPSHOT",
    // tslint:disable-next-line:max-line-length
    pattern: /^v?(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)\.(?:0|[1-9]\d*)(?:-(?:[1-9]\d*|\d*[-A-Za-z][-A-Za-z\d]*)(?:\.(?:[1-9]\d*|\d*[-A-Za-z][-A-Za-z\d]*))*)?(?:\+[-A-Za-z\d]+(?:\.[-A-Za-z\d]+)*)?$/,
    validInput: "a valid semantic version, http://semver.org",
    minLength: 1,
    maxLength: 50,
};
