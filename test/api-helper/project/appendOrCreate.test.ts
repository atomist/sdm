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

import { InMemoryProject } from "@atomist/automation-client/project/mem/InMemoryProject";
import * as assert from "power-assert";
import { appendOrCreateFileContent } from "../../../src/api-helper/project/appendOrCreate";

describe("appendOrCreate", () => {

    it("should create if doesn't exist", async () => {
        const p = InMemoryProject.of();
        await appendOrCreateFileContent({toAppend: "content", path: "Thing1"})(p);
        const f = await p.getFile("Thing1");
        assert(!!f, "File should have been created");
        assert.equal(f.getContentSync(), "content");
    });

    it("should append if does exist", async () => {
        const p = InMemoryProject.of({path: "Thing1", content: "dogs"});
        await appendOrCreateFileContent({toAppend: "content", path: "Thing1"})(p);
        const f = await p.getFile("Thing1");
        assert(!!f, "File should still exist");
        assert.equal(f.getContentSync(), "dogscontent");
    });

    it("should be idempotent: default literal", async () => {
        const p = InMemoryProject.of({path: "Thing1", content: "dogscontent"});
        await appendOrCreateFileContent({toAppend: "content", path: "Thing1"})(p);
        const f = await p.getFile("Thing1");
        assert(!!f, "File should still exist");
        assert.equal(f.getContentSync(), "dogscontent");
    });

    it("should be idempotent: custom test (yes)", async () => {
        const p = InMemoryProject.of({path: "Thing1", content: "dogs"});
        await appendOrCreateFileContent({
            toAppend: "content", path: "Thing1",
            leaveAlone: oldContent => oldContent.includes("dog"),
        })(p);
        const f = await p.getFile("Thing1");
        assert(!!f, "File should still exist");
        assert.equal(f.getContentSync(), "dogs");
    });

    it("should be idempotent: custom test (no)", async () => {
        const p = InMemoryProject.of({path: "Thing1", content: "dogs"});
        await appendOrCreateFileContent({
            toAppend: "content", path: "Thing1",
            leaveAlone: oldContent => oldContent.includes("cats"),
        })(p);
        const f = await p.getFile("Thing1");
        assert(!!f, "File should still exist");
        assert.equal(f.getContentSync(), "dogscontent");
    });

});
