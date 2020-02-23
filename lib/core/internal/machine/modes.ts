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

import { PushTest } from "../../../api/mapping/PushTest";

/**
 * Is this SDM in local mode?
 * Invoked on client startup.
 */
export function isInLocalMode(): boolean {
    return process.env.ATOMIST_MODE === "local";
}

/**
 * Is this SDM running in local mode?
 */
export const IsInLocalMode: PushTest = {
    name: "IsInLocalMode",
    mapping: async () => isInLocalMode(),
};

/**
 * Is this SDM running as a GitHub action?
 * Invoked on client startup.
 */
export function isGitHubAction(): boolean {
    return !!process.env.GITHUB_WORKFLOW && !!process.env.GITHUB_ACTION && !!process.env.GITHUB_WORKSPACE;
}

/**
 * Is this SDM running as a GitHub action?
 */
export const IsGitHubAction: PushTest = {
    name: "IsGitHubAction",
    mapping: async () => isGitHubAction(),
};
