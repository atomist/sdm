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

import {
    GitCommandGitProject,
    GitHubRepoRef,
    InMemoryProject,
} from "@atomist/automation-client";
import * as assert from "assert";
import * as path from "path";
import { loadProjectContributions } from "../../../lib/api-helper/goal/projectContributions";
import { AutofixRegistration } from "../../../lib/api/registration/AutofixRegistration";

describe("loadProjectContributions", () => {

    it("should load project autofix registration", async () => {
        const project = GitCommandGitProject.fromBaseDir(
            GitHubRepoRef.from({ owner: "atomist", repo: "sdm" }),
            path.join(__dirname, "..", "..", ".."),
            undefined,
            undefined);

        const registrations = await loadProjectContributions<AutofixRegistration>(
            project,
            "test/api-helper/goal",
            "Autofix");
        assert(!!registrations);
        assert.strictEqual(registrations.length, 1);
        assert.strictEqual(registrations[0].name, Autofix.name);

        const testProject = InMemoryProject.from({ owner: "test", repo: "name" } as any);
        await (registrations[0].transform as any)(testProject);
        assert(!!(await testProject.hasFile("test")));
    }).timeout(5000);

});

export const Autofix: AutofixRegistration = {
    name: "test-autofix",
    transform: async p => {
        await p.addFile("test", "123456");
    },
};
