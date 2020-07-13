/*
 * Copyright © 2020 Atomist, Inc.
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

import { InMemoryFile as InMemoryProjectFile } from "@atomist/automation-client/lib/project/mem/InMemoryFile";
import { InMemoryProject } from "@atomist/automation-client/lib/project/mem/InMemoryProject";
import * as assert from "assert";
import { MavenProjectIdentifier } from "../../../../../lib/pack/jvm/maven/parse/pomParser";
import { springBootPom } from "../../util";

describe("pomParser", () => {
    it("should find no Maven version when no POM", async () => {
        const p = InMemoryProject.of();
        const id = await MavenProjectIdentifier(p);
        assert(!id);
    });

    it("should find Maven version", async () => {
        const p = InMemoryProject.of(new InMemoryProjectFile("pom.xml", springBootPom()));
        const id = await MavenProjectIdentifier(p);
        assert.strictEqual(id.group, "com.atomist.springteam");
        assert.strictEqual(id.artifact, "spring-rest-seed");
        assert.strictEqual(id.version, "0.1.0-SNAPSHOT");
        assert.strictEqual(id.scope, undefined);
    });
});
