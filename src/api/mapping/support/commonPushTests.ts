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

import { fileExists } from "@atomist/automation-client/project/util/projectUtils";
import { PredicatePushTest, predicatePushTest, PushTest, pushTest } from "../PushTest";

export const ToDefaultBranch: PushTest = pushTest("Push to default branch", async p =>
    p.push.branch === p.push.repo.defaultBranch ||
    ((!p.push.repo.defaultBranch || p.push.repo.defaultBranch.length === 0) && p.push.branch === "master"));

/**
 * Is this a push originated by Atomist? Note that we can't look at the committer,
 * as if a user invoked a command handler, their credentials will be used
 * @param {PushListenerInvocation} p
 * @return {boolean}
 * @constructor
 */
export const FromAtomist: PushTest = pushTest("Push from Atomist", async p =>
    p.push.after.message.includes("[atomist]"));

/**
 * Match on any push
 * @param {PushListenerInvocation} p
 * @constructor
 */
export const AnyPush: PushTest = pushTest("Any push", async p => true);

/**
 * Return a PushTest testing for the existence of the given file
 * @param {string} path
 * @return {PushTest}
 */
export function hasFile(path: string): PredicatePushTest {
    return predicatePushTest(`HasFile(${path}})`,
        async p => !!(await p.getFile(path)));
}

/**
 * Return a PushTest testing for the existence of the given file containing the pattern
 * @param {string} path
 * @param pattern regex to look for
 * @return {PushTest}
 */
export function hasFileContaining(path: string, pattern: RegExp): PredicatePushTest {
    return predicatePushTest(`HasFile(${path}} containing ${pattern.source})`,
        async p => {
            const f = await p.getFile(path);
            if (!f) {
                return false;
            }
            const content = await f.getContent();
            return pattern.test(content);
        });
}

/**
 * PushTest that returns true if project is non empty
 * @type {PredicatePushTest}
 */
export const NonEmpty: PredicatePushTest = predicatePushTest("NonEmpty",
    async p => (await p.totalFileCount()) > 0);

/**
 * Is there at least one file with the given extension?
 * @param {string} extension
 * @return {PredicatePushTest}
 */
export function hasFileWithExtension(extension: string): PredicatePushTest {
    if (!extension) {
        return NonEmpty;
    }
    const extensionToUse = extension.startsWith(".") ? extension : `.${extension}`;
    return predicatePushTest(`HasFileWithExtension(${extensionToUse}})`,
        async p => fileExists(p, `**/*${extensionToUse}`, () => true));
}
