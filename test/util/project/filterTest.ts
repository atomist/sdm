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

import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";

import { filtered } from "../../../src/util/project/filter";

import * as assert from "power-assert";

describe("Project filtered", () => {

    it("should copy to empty", async () => {
        const p = await GitCommandGitProject.cloned({ token: null}, new GitHubRepoRef("atomist-seeds", "spring-rest-seed"));
        const copied = await filtered(p, []);
        assert.equal(0, await copied.totalFileCount());
    }).timeout(10000);

    it("should copy one", async () => {
        const p = await GitCommandGitProject.cloned({ token: null}, new GitHubRepoRef("atomist-seeds", "spring-rest-seed"));
        const copied = await filtered(p, ["pom.xml"]);
        assert.equal(1, await copied.totalFileCount());
        await copied.findFile("pom.xml");
    }).timeout(10000);

});
