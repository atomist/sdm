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

import {
    GitHubRepoRef,
    GitProject,
    InMemoryProjectFile,
    InMemoryProject,
    Project,
    projectUtils,
} from "@atomist/automation-client";
import * as assert from "power-assert";
import { save } from "../../../lib/api-helper/project/CachingProjectLoader";
import { CloningProjectLoader } from "../../../lib/api-helper/project/cloningProjectLoader";
import { LazyProjectLoader } from "../../../lib/api-helper/project/LazyProjectLoader";
import { SingleProjectLoader } from "../../../lib/api-helper/testsupport/SingleProjectLoader";

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
        const id = GitHubRepoRef.from({ owner: "spring-team", repo: "spring-rest-seed", branch: "master" });
        const lpl = new LazyProjectLoader(CloningProjectLoader);
        const p: Project = await save(lpl, { credentials, id, readOnly: false });
        const f1 = await p.getFile("not-there");
        assert(!f1);
        const pom = await p.getFile("pom.xml");
        assert(!!pom.getContentSync());
    }).timeout(10000);

    it("should get file after stream", async () => {
        const id = GitHubRepoRef.from({ owner: "spring-team", repo: "spring-rest-seed", branch: "master" });
        const lpl = new LazyProjectLoader(CloningProjectLoader);
        const p: Project = await save(lpl, { credentials, id, readOnly: false });
        let count = 0;
        await projectUtils.doWithFiles(p, "**", f => {
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
        const id = GitHubRepoRef.from({ owner: "spring-team", repo: "spring-rest-seed", branch: "master" });
        const lpl = new LazyProjectLoader(CloningProjectLoader);
        const p: Project = await save(lpl, { credentials, id, readOnly: false });
        let count = 0;
        await projectUtils.doWithFiles(p, "**", f => {
            // tslint:disable-next-line:no-console
            ++count;
            assert(!!f.getContentSync());
        });
        assert(count > 0);
    }).timeout(10000);

    it("should materialize once", async () => {
        // Look at log output
        const id = GitHubRepoRef.from({ owner: "spring-team", repo: "spring-rest-seed", branch: "master" });
        const lpl = new LazyProjectLoader(CloningProjectLoader);
        const p: Project = await save(lpl, { credentials, id, readOnly: false });
        const f1 = await p.getFile("not-there");
        assert(!f1);
        await Promise.all([1, 2, 3].map(() => projectUtils.doWithFiles(p, "**", f => {
            // tslint:disable-next-line:no-console
            assert(!!f.getContentSync());
        })));
    }).timeout(10000);

    it("should commit and push", async () => {
        const id = GitHubRepoRef.from({ owner: "this.is.invalid", repo: "nonsense", branch: "master" });
        const raw = InMemoryProject.from(id, new InMemoryProjectFile("a", "b")) as any as GitProject;
        let commits = 0;
        let pushes = 0;
        raw.commit = async () => {
            ++commits;
            return raw;
        };
        raw.push = async () => {
            ++pushes;
            return raw;
        };
        const lpl = new SingleProjectLoader(raw);
        const p: GitProject = await save(lpl, { credentials, id, readOnly: false });
        assert.equal(p.name, id.repo);
        assert.equal(p.id, id);
        await p.commit("foo bar").then(x => x.push());
        assert.equal(commits, 1);
        assert.equal(pushes, 1);
        await p.commit("foo baz").then(() => p.push());
        assert.equal(commits, 2);
        assert.equal(pushes, 2);
    });
});
