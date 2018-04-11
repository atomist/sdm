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

import { SimpleRepoId } from "@atomist/automation-client/operations/common/RepoId";
import { InMemoryProject } from "@atomist/automation-client/project/mem/InMemoryProject";

import * as assert from "power-assert";
import { CloudFoundryManifestPath } from "../../../../src/common/delivery/deploy/pcf/CloudFoundryTarget";
import {
    addCloudFoundryManifestEditor, AtomistConfigTsPath,
    StartAutomationClientCommand,
} from "../../../../src/software-delivery-machine/commands/editors/pcf/addCloudFoundryManifest";
import { fakeContext } from "../../FakeContext";
import { NonSpringPom, springBootPom } from "../TestPoms";

describe("addCloudFoundryManifest", () => {

    it("should add a manifest to Spring Boot project when none exists", async () => {
        const p = InMemoryProject.from(new SimpleRepoId("owner", "repoName"),
            {path: "pom.xml", content: springBootPom()});
        const teamId = "T123";
        await addCloudFoundryManifestEditor(p, fakeContext(teamId));
        assert(p.fileExistsSync(CloudFoundryManifestPath), "Should have manifest file");
        const content = p.findFileSync(CloudFoundryManifestPath).getContentSync();
        assert(content.includes("spring-rest-seed"), "Should contain app name");
        assert(content.includes(teamId), "Should contain team id");
    });

    it("should not add a manifest to non Spring Boot Java project", async () => {
        const p = InMemoryProject.from(new SimpleRepoId("owner", "repoName"),
            {path: "pom.xml", content: NonSpringPom});
        const teamId = "T123";
        await addCloudFoundryManifestEditor(p, fakeContext(teamId));
        assert(!p.fileExistsSync(CloudFoundryManifestPath), "Should not have manifest file");
    });

    it("should add a non automation client manifest to Node project when none exists", async () => {
        const p = InMemoryProject.from(new SimpleRepoId("owner", "repoName"),
            {
                path: "package.json", content: JSON.stringify({name: "node-seed"}),
            });
        const teamId = "T123";
        await addCloudFoundryManifestEditor(p, fakeContext(teamId));
        assert(p.fileExistsSync(CloudFoundryManifestPath), "Should have manifest file");
        const content = p.findFileSync(CloudFoundryManifestPath).getContentSync();
        assert(content.includes("node-seed"), "Should contain app name");
        assert(content.includes(teamId), "Should contain team id");
        assert(!content.includes(StartAutomationClientCommand), "Shouldn't contain automation client start command");
    });

    it("should add an automation client manifest to Node project when none exists", async () => {
        const p = InMemoryProject.from(new SimpleRepoId("owner", "repoName"),
            {
                path: "package.json", content: JSON.stringify({name: "node-seed"}),
            },
            {
                path: AtomistConfigTsPath, content: "// automation client",
            });
        const teamId = "T123";
        await addCloudFoundryManifestEditor(p, fakeContext(teamId));
        assert(p.fileExistsSync(CloudFoundryManifestPath), "Should have manifest file");
        const content = p.findFileSync(CloudFoundryManifestPath).getContentSync();
        assert(content.includes("node-seed"), "Should contain app name");
        assert(content.includes(teamId), "Should contain team id");
        assert(content.includes(StartAutomationClientCommand), "Shouldn't contain automation client start command");
    });

});
