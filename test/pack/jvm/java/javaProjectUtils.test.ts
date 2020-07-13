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
import * as assert from "power-assert";
import { movePackage, renameClass } from "../../../../lib/pack/jvm/java/javaProjectUtils";

describe("javaProjectUtils", () => {
    it("should not refactor on no match", async () => {
        const t = new InMemoryProject();
        t.addFileSync("src/main/java/Foo.java", "public class Foo {}");
        await movePackage(t, "com.foo", "com.bar");
        const found = t.findFileSync("src/main/java/Foo.java");
        assert.strictEqual(found.getContentSync(), "public class Foo {}");
    });

    it("should refactor on simple match", async () => {
        const t = new InMemoryProject();
        t.addFileSync("src/main/java/com/foo/Foo.java", "package com.foo;\npublic class Foo {}");
        await movePackage(t, "com.foo", "com.bar");
        const found = t.findFileSync("src/main/java/com/bar/Foo.java");
        assert.strictEqual(found.getContentSync(), "package com.bar;\npublic class Foo {}");
    });

    it("should refactor on deeper match", async () => {
        const t = new InMemoryProject();
        t.addFileSync("src/main/java/com/foo/bar/Foo.java", "package com.foo.bar;\npublic class Foo {}");
        await movePackage(t, "com.foo.bar", "com.something.else");
        const found = t.findFileSync("src/main/java/com/something/else/Foo.java");
        assert(!!found);
        assert.strictEqual(found.getContentSync(), "package com.something.else;\npublic class Foo {}");
    });

    it("should refactor using common path artifactPrefix", async () => {
        const p = InMemoryProject.of(
            {
                path: "src/main/java/com/bands/smashing/pumpkins/Gish.java",
                content: "package com.bands.smashing.pumpkins; public class Gish {}",
            },
            {
                path: "src/main/java/com/bands/nirvana/Thing.java",
                content: "package com.bands.nirvana; public class Thing {}",
            },
        );
        await movePackage(p, "com.bands", "com.nineties");
        assert(!p.findFileSync("src/main/java/com/bands/smashing/pumpkins/Gish.java"));
        const nirvana = p.findFileSync("src/main/java/com/nineties/nirvana/Thing.java");
        assert(nirvana);
        assert(nirvana.getContentSync() === "package com.nineties.nirvana; public class Thing {}");
        const pumpkins = p.findFileSync("src/main/java/com/nineties/smashing/pumpkins/Gish.java");
        assert(pumpkins);
        assert.strictEqual(pumpkins.getContentSync(), "package com.nineties.smashing.pumpkins; public class Gish {}");
    });

    it("should not work on Kotlin by default", async () => {
        const t = new InMemoryProject();
        t.addFileSync("src/main/kotlin/com/foo/bar/Foo.kt", "package com.foo.bar\npublic class Foo {}");
        await movePackage(t, "com.foo.bar", "com.something.else");
        const found = t.findFileSync("src/main/java/com/something/else/Foo.kt");
        assert(!found);
    });

    it("should work on Kotlin with correct glob pattern", async () => {
        const t = new InMemoryProject();
        t.addFileSync("src/main/kotlin/com/foo/bar/Foo.kt", "package com.foo.bar\npublic class Foo {}");
        await movePackage(t, "com.foo.bar", "com.something.else", "**/*.kt");
        const found = t.findFileSync("src/main/kotlin/com/something/else/Foo.kt");
        assert(found);
        assert.strictEqual(found.getContentSync(), "package com.something.else\npublic class Foo {}");
    });

    describe("renameClass", () => {
        it("shouldn't do anything on empty project", async () => {
            const p = new InMemoryProject();
            await renameClass(p, "Foo", "Bar");
            assert.strictEqual(await p.totalFileCount(), 0);
        });

        it("rename Java in default package", async () => {
            const p = InMemoryProject.of(new InMemoryProjectFile("src/main/java/Thing.java", "public class Thing {}"));
            await renameClass(p, "Thing", "OtherThing");
            const renamed = await p.findFile("src/main/java/OtherThing.java");
            assert(!!renamed);
            assert.strictEqual(renamed.getContentSync(), "public class OtherThing {}");
        });

        it("rename Java class only", async () => {
            const p = InMemoryProject.of(
                new InMemoryProjectFile("src/main/java/Thing.java", "public class Thing { int aThing; }"),
            );
            await renameClass(p, "Thing", "OtherThing");
            const renamed = await p.findFile("src/main/java/OtherThing.java");
            assert(!!renamed);
            assert.strictEqual(renamed.getContentSync(), "public class OtherThing { int aThing; }");
        });

        it("rename Java class and internal reference", async () => {
            const p = InMemoryProject.of(
                new InMemoryProjectFile(
                    "src/main/java/Thing.java",
                    "public class Thing { static t: Thing = undefined; }",
                ),
            );
            await renameClass(p, "Thing", "OtherThing");
            const renamed = await p.findFile("src/main/java/OtherThing.java");
            assert(!!renamed);
            assert.strictEqual(
                renamed.getContentSync(),
                "public class OtherThing { static t: OtherThing = undefined; }",
            );
        });

        it("rename Java class and no-space internal reference", async () => {
            const p = InMemoryProject.of(
                new InMemoryProjectFile(
                    "src/main/java/Thing.java",
                    "public class Thing { SpringApplication.run(Thing.class, args); }",
                ),
            );
            await renameClass(p, "Thing", "OtherThing");
            const renamed = await p.findFile("src/main/java/OtherThing.java");
            assert(!!renamed);
            assert.strictEqual(
                renamed.getContentSync(),
                "public class OtherThing { SpringApplication.run(OtherThing.class, args); }",
            );
        });

        it("rename Initializr class", async () => {
            const p = InMemoryProject.of(
                new InMemoryProjectFile("src/main/java/SpringRestSeedApplication.java", Initializr1),
            );
            await renameClass(p, "SpringRestSeedApplication", "CustomApplication");
            const renamed = await p.getFile("src/main/java/CustomApplication.java");
            assert(!!renamed, "Files were " + p.filesSync.map(f => f.path).join("\n"));
            const content = renamed.getContentSync();
            assert(content.includes("CustomApplication"), "Should have included CustomApplication:\n" + content);
            assert(
                !content.includes("SpringRestSeedApplication"),
                "Should not have included SpringRestSeedApplication:\n" + content,
            );
        });

        it("rename Initializr class stem", async () => {
            const p = InMemoryProject.of(
                new InMemoryProjectFile("src/main/java/SpringRestSeedApplication.java", Initializr1),
            );
            await renameClass(p, "SpringRestSeed", "Custom");
            const renamed = await p.getFile("src/main/java/CustomApplication.java");
            assert(!!renamed, "Files were " + p.filesSync.map(f => f.path).join("\n"));
            const content = renamed.getContentSync();
            assert(content.includes("CustomApplication"), "Should have included CustomApplication:\n" + content);
            assert(
                !content.includes("SpringRestSeedApplication"),
                "Should not have included SpringRestSeedApplication:\n" + content,
            );
        });

        it("rename Kotlin in default package", async () => {
            const p = InMemoryProject.of(new InMemoryProjectFile("src/main/kotlin/Thing.kt", "public class Thing {}"));
            await renameClass(p, "Thing", "OtherThing");
            const renamed = await p.getFile("src/main/kotlin/OtherThing.kt");
            assert(!!renamed, "Files were " + p.filesSync.map(f => f.path).join("\n"));
            assert.strictEqual(renamed.getContentSync(), "public class OtherThing {}");
        });
    });
});

/* tslint:disable */
const Initializr1 = `package com;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class SpringRestSeedApplication {

	public static void main(String[] args) {
		SpringApplication.run(SpringRestSeedApplication.class, args);
	}
}`;
