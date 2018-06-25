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
import { InMemoryProject } from "@atomist/automation-client/project/mem/InMemoryProject";
import * as assert from "power-assert";
import { copyFileFromUrl, copyFilesFrom } from "../../../src/api-helper/project/fileCopy";

describe("fileCopy", () => {

    it("should copy file from url", async () => {
        const recipient = InMemoryProject.of();
        await (copyFileFromUrl("https://raw.githubusercontent.com/spring-team/spring-rest-seed/master/pom.xml", "pom.xml"))(recipient);
        assert(!!(await recipient.getFile("pom.xml")));
    }).timeout(5000);

    it("should copy file from donor project", async () => {
        const donorId = new GitHubRepoRef("spring-team", "spring-rest-seed");
        const filesToSteal = [ "pom.xml"];
        const recipient = InMemoryProject.of();
        await (copyFilesFrom(donorId, filesToSteal, { token: process.env.GITHUB_TOKEN}))(recipient);
        assert(!!(await recipient.getFile(filesToSteal[0])));
    }).timeout(5000);

    it("should copy file from donor project with mapping", async () => {
        const donorId = new GitHubRepoRef("spring-team", "spring-rest-seed");
        const filesToSteal = [ { donorPath: "pom.xml", recipientPath: "foo" }];
        const recipient = InMemoryProject.of();
        await (copyFilesFrom(donorId, filesToSteal, { token: process.env.GITHUB_TOKEN}))(recipient);
        assert(!(await recipient.getFile(filesToSteal[0].donorPath)));
        assert(!!(await recipient.getFile(filesToSteal[0].recipientPath)));
    }).timeout(5000);
});
