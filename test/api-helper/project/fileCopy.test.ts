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
    configureLogging,
    GitHubRepoRef,
    InMemoryProject, MinimalLogging,
} from "@atomist/automation-client";
import * as assert from "power-assert";
import {
    copyFileFromUrl,
    copyFilesFrom,
    FileGlobMapping,
    streamFiles,
} from "../../../lib/api-helper/project/fileCopy";

describe("fileCopy", () => {
    before(() => configureLogging(MinimalLogging));
    it("should copy file from url", async () => {
        const recipient = InMemoryProject.of();
        await (copyFileFromUrl("https://raw.githubusercontent.com/spring-team/spring-rest-seed/master/pom.xml", "pom.xml"))(recipient, undefined);
        assert(!!(await recipient.getFile("pom.xml")));
    }).timeout(5000);

    it("should copy file from donor project", async () => {
        const donorId = new GitHubRepoRef("spring-team", "spring-rest-seed");
        const filesToSteal = [ "pom.xml"];
        const recipient = InMemoryProject.of();
        await (copyFilesFrom(donorId, filesToSteal, { token: process.env.GITHUB_TOKEN}))(recipient, undefined);
        assert(!!(await recipient.getFile(filesToSteal[0])));
    }).timeout(5000);

    it("should copy file from donor project with mapping", async () => {
        const donorId = new GitHubRepoRef("spring-team", "spring-rest-seed");
        const filesToSteal = [ { donorPath: "pom.xml", recipientPath: "foo" }];
        const recipient = InMemoryProject.of();
        await (copyFilesFrom(donorId, filesToSteal, { token: process.env.GITHUB_TOKEN}))(recipient, undefined);
        assert(!(await recipient.getFile(filesToSteal[0].donorPath)));
        assert(!!(await recipient.getFile(filesToSteal[0].recipientPath)));
    }).timeout(5000);

    it("should copy a subset of files from donor project according to glob", async () => {
        const donorProject = InMemoryProject.of(
            {path: "/", content: "root file"},
            {path: "a/b/a", content: "b/a file"},
            {path: "a/b/b", content: "b/b file"},
        );

        const filesToSteal: FileGlobMapping = { globPatterns: ["a/**"], recipientPath: "c/" };
        const recipient = InMemoryProject.of();

        await (streamFiles(donorProject, filesToSteal))(recipient, undefined);

        assert(3 === (await donorProject.totalFileCount()));

        assert(!!(await recipient.getFile("c/a/b/a")));
        assert(!!(await recipient.getFile("c/a/b/b")));

        assert(2 === (await recipient.totalFileCount()));
    });

    it("should copy a subset of files from donor project handling undefined recipient path", async () => {
        let i = 0;

        const donorProject = InMemoryProject.of(
            {path: "/", content: "root file"},
            {path: "a/b/a", content: "b/a file"},
            {path: "a/b/b", content: "b/b file"},
            {path: "a/b/c" + (++i), content: "b/c file " + i},
            {path: "a/b/c" + (++i), content: "b/c file " + i},
            {path: "a/b/c" + (++i), content: "b/c file " + i},
            {path: "a/b/c" + (++i), content: "b/c file " + i},
            {path: "a/b/c" + (++i), content: "b/c file " + i},
            {path: "a/b/c" + (++i), content: "b/c file " + i},
            {path: "a/b/c" + (++i), content: "b/c file " + i},
            {path: "a/b/c" + (++i), content: "b/c file " + i},
            {path: "a/b/c" + (++i), content: "b/c file " + i},
            {path: "a/b/c" + (++i), content: "b/c file " + i},
            {path: "a/b/c" + (++i), content: "b/c file " + i},
            {path: "a/b/c" + (++i), content: "b/c file " + i},
            {path: "a/b/c" + (++i), content: "b/c file " + i},
            {path: "a/b/c" + (++i), content: "b/c file " + i},
            {path: "a/b/c" + (++i), content: "b/c file " + i},
            {path: "a/b/c" + (++i), content: "b/c file " + i},
            {path: "a/b/c" + (++i), content: "b/c file " + i},
            {path: "a/b/c" + (++i), content: "b/c file " + i},
            {path: "a/b/c" + (++i), content: "b/c file " + i},
            {path: "a/b/c" + (++i), content: "b/c file " + i},
        );

        const filesToSteal: FileGlobMapping = { globPatterns: ["a/**"]};
        const recipient = InMemoryProject.of();

        await (streamFiles(donorProject, filesToSteal))(recipient, undefined);

        i = 0;
        const numDonorFiles = await donorProject.totalFileCount();
        assert(23 === (numDonorFiles), "Num files " + numDonorFiles);

        assert(!!(await recipient.getFile("a/b/b")));
        assert(!!(await recipient.getFile("a/b/a")));
        assert(!!(await recipient.getFile("a/b/c" + (++i))));
        assert(!!(await recipient.getFile("a/b/c" + (++i))));
        assert(!!(await recipient.getFile("a/b/c" + (++i))));
        assert(!!(await recipient.getFile("a/b/c" + (++i))));
        assert(!!(await recipient.getFile("a/b/c" + (++i))));
        assert(!!(await recipient.getFile("a/b/c" + (++i))));
        assert(!!(await recipient.getFile("a/b/c" + (++i))));
        assert(!!(await recipient.getFile("a/b/c" + (++i))));
        assert(!!(await recipient.getFile("a/b/c" + (++i))));
        assert(!!(await recipient.getFile("a/b/c" + (++i))));
        assert(!!(await recipient.getFile("a/b/c" + (++i))));
        assert(!!(await recipient.getFile("a/b/c" + (++i))));
        assert(!!(await recipient.getFile("a/b/c" + (++i))));
        assert(!!(await recipient.getFile("a/b/c" + (++i))));
        assert(!!(await recipient.getFile("a/b/c" + (++i))));
        assert(!!(await recipient.getFile("a/b/c" + (++i))));
        assert(!!(await recipient.getFile("a/b/c" + (++i))));
        assert(!!(await recipient.getFile("a/b/c" + (++i))));
        assert(!!(await recipient.getFile("a/b/c" + (++i))));
        assert(!!(await recipient.getFile("a/b/c" + (++i))));

        const totalFiles = await recipient.totalFileCount();
        assert(22 === (totalFiles), "Num files " + totalFiles);
    });
});
