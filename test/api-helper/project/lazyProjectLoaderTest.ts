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
import { Project } from "@atomist/automation-client/project/Project";
import { doWithFiles } from "@atomist/automation-client/project/util/projectUtils";
import * as assert from "power-assert";
import { save } from "../../../src/api-helper/project/CachingProjectLoader";
import { CloningProjectLoader } from "../../../src/api-helper/project/cloningProjectLoader";
import { LazyProjectLoader } from "../../../src/api-helper/project/LazyProjectLoader";

const credentials = {
    token: process.env.GITHUB_TOKEN,
};

describe("LazyProjectLoader", () => {

    it("should not need to load for name or id", async () => {
        const id = new GitHubRepoRef("this.is.invalid", "nonsense");
        const lpl = new LazyProjectLoader(CloningProjectLoader);
        const p: Project = await save(lpl, { credentials, id, readOnly: false });
        assert.equal(p.name, id.repo);
        assert.equal(p.id, id);
    });

    it("should get file first", async () => {
        const id = new GitHubRepoRef("spring-team", "spring-rest-seed");
        const lpl = new LazyProjectLoader(CloningProjectLoader);
        const p: Project = await save(lpl, { credentials, id, readOnly: false });
        const f1 = await p.getFile("not-there");
        assert(!f1);
        const pom = await p.getFile("pom.xml");
        assert(!!pom.getContentSync());
    }).timeout(10000);

    it("should get file after stream", async () => {
        const id = new GitHubRepoRef("spring-team", "spring-rest-seed");
        const lpl = new LazyProjectLoader(CloningProjectLoader);
        const p: Project = await save(lpl, { credentials, id, readOnly: false });
        let count = 0;
        await doWithFiles(p, "**", f => {
            // tslint:disable-next-line:no-console
            ++count;
            assert(!!f.getContentSync());
        });
        assert(count > 0);
        const f1 = await p.getFile("not-there");
        assert(!f1);
        const pom = await p.getFile("pom.xml");
        assert(!!pom.getContentSync());
    }).timeout(10000);

    it("should load for files", async () => {
        const id = new GitHubRepoRef("spring-team", "spring-rest-seed");
        const lpl = new LazyProjectLoader(CloningProjectLoader);
        const p: Project = await save(lpl, { credentials, id, readOnly: false });
        let count = 0;
        await doWithFiles(p, "**", f => {
            // tslint:disable-next-line:no-console
            ++count;
            assert(!!f.getContentSync());
        });
        assert(count > 0);
    }).timeout(10000);

    it("should materialize once", async () => {
        // Look at log output
        const id = new GitHubRepoRef("spring-team", "spring-rest-seed");
        const lpl = new LazyProjectLoader(CloningProjectLoader);
        const p: Project = await save(lpl, { credentials, id, readOnly: false });
        const f1 = await p.getFile("not-there");
        assert(!f1);
        await Promise.all([1, 2, 3].map(() => doWithFiles(p, "**", f => {
            // tslint:disable-next-line:no-console
            assert(!!f.getContentSync());
        })));
    }).timeout(10000);
});
