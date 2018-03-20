/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { logger } from "@atomist/automation-client";
import { isGitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { isPublicRepo } from "../../../util/github/ghub";
import { PushTest, pushTest } from "../PushTest";

export const ToDefaultBranch = pushTest("Push to default branch", p => {
    const flag = p.push.branch === p.push.repo.defaultBranch;
    logger.info("Push to %j on branch %s: ToDefaultBranch=%d", p.id, p.push.branch, flag);
    return flag;
});

/**
 * Is this a push originated by Atomist? Note that we can't look at the committer,
 * as if a user invoked a command handler, their credentials will be used
 * @param {PushTestInvocation} p
 * @return {boolean}
 * @constructor
 */
export const FromAtomist = pushTest("Push from Atomist", p => {
    return p.push.after.message.includes("[atomist]");
});

/**
 * Match on any push
 * @param {PushTestInvocation} p
 * @constructor
 */
export const AnyPush: PushTest = pushTest("Any push", async p => true);

/**
 * Match only pushes on a public repo
 * @param {PushTestInvocation} p
 * @return {Promise<boolean>}
 * @constructor
 */
export const ToPublicRepo = pushTest("To public repo", async p =>
    // Ask GitHub if the repo is public as we do not have this information in our model
    isGitHubRepoRef(p.id) && (await isPublicRepo(process.env.GITHUB_TOKEN, p.id)),
);
