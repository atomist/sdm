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
import { hasDeclaredDependency, hasDependency, IsMaven } from "../../../../lib/pack/jvm/maven/pushTests";
import { springBootPom, tempProject } from "../util";

describe("Maven pushtests", () => {
    describe("IsMaven", () => {
        it("should be false for empty project", async () => {
            const p = InMemoryProject.of();
            assert(!(await IsMaven.predicate(p)));
        });

        it("should be true with pom", async () => {
            const p = InMemoryProject.of(new InMemoryProjectFile("pom.xml", springBootPom()));
            assert(await IsMaven.predicate(p));
        });
    });

    describe("hasDeclaredDependency", () => {
        it("should be false for empty project", async () => {
            const p = InMemoryProject.of();
            assert(!(await hasDeclaredDependency({}).predicate(p)));
        });

        it("should be true with any dependency with pom", async () => {
            const p = InMemoryProject.of(new InMemoryProjectFile("pom.xml", springBootPom()));
            assert(await hasDeclaredDependency({}).predicate(p));
        });

        it("should be true with group dependency with pom", async () => {
            const p = InMemoryProject.of(new InMemoryProjectFile("pom.xml", springBootPom()));
            assert(await hasDeclaredDependency({ group: "org.springframework.boot" }).predicate(p));
        });

        it("should be false with group dependency with pom", async () => {
            const p = InMemoryProject.of(new InMemoryProjectFile("pom.xml", springBootPom()));
            assert(!(await hasDeclaredDependency({ group: "not.a.group" }).predicate(p)));
        });

        it("should be true with artifact dependency with pom", async () => {
            const p = InMemoryProject.of(new InMemoryProjectFile("pom.xml", springBootPom()));
            assert(await hasDeclaredDependency({ artifact: "spring-boot-starter-test" }).predicate(p));
        });

        it("should be false with artifact dependency with pom", async () => {
            const p = InMemoryProject.of(new InMemoryProjectFile("pom.xml", springBootPom()));
            assert(!(await hasDeclaredDependency({ artifact: "not.an.artifact" }).predicate(p)));
        });

        it("should be true with artifact and group dependency with pom", async () => {
            const p = InMemoryProject.of(new InMemoryProjectFile("pom.xml", springBootPom()));
            assert(
                await hasDeclaredDependency({
                    group: "org.springframework.boot",
                    artifact: "spring-boot-starter-test",
                }).predicate(p),
            );
        });

        it("should be true with artifact and group and version dependency with pom", async () => {
            const p = InMemoryProject.of(new InMemoryProjectFile("pom.xml", springBootPom()));
            assert(
                !(await hasDeclaredDependency({
                    group: "org.springframework.boot",
                    artifact: "spring-boot-starter-test",
                    version: "1.3.5",
                }).predicate(p)),
            );
        });

        it("should handle versions from property");

        it("should handle inherited versions");
    });

    describe("hasDependency", () => {
        it("should be false for empty project", async () => {
            const p = tempProject({ owner: "frank", repo: "underhill", url: "1600 Pennsylvania Ave" });
            assert(!(await hasDependency({}).predicate(p)));
        });

        it("should be true with any dependency with pom", async () => {
            const p = tempProject({ owner: "frank", repo: "underhill", url: "1600 Pennsylvania Ave" });
            p.addFileSync("pom.xml", springBootPom());
            assert(await hasDependency({}).predicate(p));
        });

        it("should be true with any dependency with pom", async () => {
            const p = tempProject({ owner: "frank", repo: "underhill", url: "1600 Pennsylvania Ave" });
            p.addFileSync("pom.xml", springBootPom());
            assert(
                await hasDependency({
                    group: "org.springframework.boot",
                    artifact: "spring-boot-starter-test",
                }).predicate(p),
            );
        });
    });
});
