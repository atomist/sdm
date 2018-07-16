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

import { InMemoryFile } from "@atomist/automation-client/project/mem/InMemoryFile";
import { InMemoryProject } from "@atomist/automation-client/project/mem/InMemoryProject";
import * as assert from "power-assert";
import { projectConfigurationValue } from "../../../../src/api-helper/project/configuration/projectConfiguration";

describe("projectConfigurationValue", () => {

    it("should read config setting from file", async () => {
        const project = InMemoryProject.of(
            new InMemoryFile(".atomist/config.json", JSON.stringify({ npm: { publish: { access: "private" }} })));
        assert.strictEqual(await projectConfigurationValue<string>("npm.publish.access", project), "private");
        return;
    });

    it("should return default value when config file exists", async () => {
        const project = InMemoryProject.of();
        assert.strictEqual(await projectConfigurationValue<string>("npm.publish.access", project, "private"), "private");
        return;
    });

    it("should return default value when config value doesn't exist", async () => {
        const project = InMemoryProject.of(
            new InMemoryFile(".atomist/config.json", JSON.stringify({ sdm: { enable: ["@atomist/atomist-sdm"] } })));
        assert.strictEqual(await projectConfigurationValue<string>("npm.publish.access", project, "private"), "private");
        return;
    });

    it("should return given type when config value exists", async () => {
        const project = InMemoryProject.of(
            new InMemoryFile(".atomist/config.json", JSON.stringify({ sdm: { enable: ["@atomist/atomist-sdm"] } })));
        assert.deepEqual(await projectConfigurationValue<string[]>("sdm.enable", project), ["@atomist/atomist-sdm"]);
        return;
    });
});
