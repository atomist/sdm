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

import { execPromise } from "@atomist/automation-client/lib/util/child_process";

/**
 * Use the Git CLI to fetch the previous version of the spec.  If the
 * previous does not exist or an error occurs fetching it, an empty
 * string is returned.
 *
 * @param baseDir Project repository base directory
 * @param specPath Path to spec file relative to `baseDir`
 */
export async function previousSpecVersion(baseDir: string, specPath: string, sha: string): Promise<string> {
    try {
        const showResult = await execPromise("git", ["show", `${sha}~1:${specPath}`], { cwd: baseDir });
        return showResult.stdout;
    } catch (e) {
        return "";
    }
}
