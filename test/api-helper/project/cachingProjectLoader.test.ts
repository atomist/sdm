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
import * as assert from "power-assert";
import { dirSync } from "tmp-promise";
import { computeShaOf } from "../../../lib/api-helper/misc/sha";
import {
    CachingProjectLoader,
    save,
} from "../../../lib/api-helper/project/CachingProjectLoader";
import { SingleProjectLoader } from "../../../lib/api-helper/testsupport/SingleProjectLoader";

describe("cachingProjectLoader", () => {

    it("should load project", async () => {
        const id = new GitHubRepoRef("a", "b", "master");
        const p = InMemoryProject.from(id);
        const pl = new SingleProjectLoader(p);
        const cp = new CachingProjectLoader(pl);
        const p1 = await save(cp, { id, credentials: undefined, readOnly: true });
        assert(p1 as any === p);
    });

    describe("should respect clone parameters", () => {

        let clonedCalledTimes: number;
        let originalCloned: any;
        let sha: string;
        let tmpBaseDir: any;

        before(() => {
            originalCloned = Object.getOwnPropertyDescriptor(GitCommandGitProject, "cloned");
        });

        beforeEach(() => {
            clonedCalledTimes = 0;
            sha = computeShaOf(Math.random().toString(36).substring(2));
            tmpBaseDir = dirSync();

            Object.defineProperty(GitCommandGitProject, "cloned", {
                value: () => {
                    clonedCalledTimes++;
                    return {
                        baseDir: tmpBaseDir.name,
                        id: {
                            sha: `${sha}`,
                        },
                    };
                },
            });
        });

        afterEach(() => {
            tmpBaseDir.removeCallback();
        });

        after(() => {
            Object.defineProperty(GitCommandGitProject, "cloned", originalCloned);
        });

        it("disparate", async () => {

            const id = new GitHubRepoRef("a", "b", sha);
            const cp = new CachingProjectLoader();
            await cp.doWithProject({ id, credentials: undefined, readOnly: true, cloneOptions: { depth: 1 } }, async () => { });
            await cp.doWithProject({ id, credentials: undefined, readOnly: true, cloneOptions: { depth: 5 } }, async () => { });

            assert.equal(clonedCalledTimes, 2);
        });

        it("homogeneous", async () => {

            const id = new GitHubRepoRef("a", "b", sha);
            const cp = new CachingProjectLoader();
            await cp.doWithProject({ id, credentials: undefined, readOnly: true, cloneOptions: { depth: 4 } }, async () => { });
            await cp.doWithProject({ id, credentials: undefined, readOnly: true, cloneOptions: { depth: 4 } }, async () => { });

            assert.equal(clonedCalledTimes, 1);
        });
    });

});
