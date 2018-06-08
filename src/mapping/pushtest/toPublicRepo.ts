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

import { isGitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { PushTest, pushTest } from "../../api/mapping/PushTest";
import { isPublicRepo } from "../../util/github/ghub";

/**
 * Match only pushes on a public repo
 * @param {PushListenerInvocation} p
 * @return {Promise<boolean>}
 * @constructor
 */
export const ToPublicRepo: PushTest = pushTest("To public repo", async p =>
    // Ask GitHub if the repo is public as we do not have this information in our model
    isGitHubRepoRef(p.id) && isPublicRepo(p.credentials, p.id),
);
