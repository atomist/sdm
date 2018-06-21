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

import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";

import * as assert from "power-assert";
import { PushListenerInvocation } from "../../../src/api/listener/PushListener";
import { ToPublicRepo } from "../../../src/mapping/pushtest/toPublicRepo";

const credentials = { token: process.env.GITHUB_TOKEN};

describe("pushToPublicRepo", () => {

    it("should work against public repo", async () => {
        const id = new GitHubRepoRef("atomist", "sdm");
        const r = await ToPublicRepo.mapping({id, credentials} as any as PushListenerInvocation);
        assert.equal(r, true);
    }).timeout(5000);

    it("should work against private repo", async () => {
        const id = new GitHubRepoRef("atomisthq", "internal-automation");
        const r = await ToPublicRepo.mapping({id, credentials} as any as PushListenerInvocation);
        assert.equal(r, false);
    }).timeout(5000);

});
