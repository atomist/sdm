import { InMemoryProject } from "@atomist/automation-client/project/mem/InMemoryProject";
import * as assert from "power-assert";
import { appendOrCreateFileContent } from "../../../src/util/project/appendOrCreate";

describe("appendOrCreate", () => {

    it("should create if doesn't exist", async () => {
        const p = InMemoryProject.of();
        await appendOrCreateFileContent("content", "Thing1")(p);
        const f = await p.getFile("Thing1");
        assert(!!f, "File should have been created");
        assert.equal(f.getContentSync(), "content");
    });

    it("should append if does exist", async () => {
        const p = InMemoryProject.of({path: "Thing1", content: "dogs"});
        await appendOrCreateFileContent("content", "Thing1")(p);
        const f = await p.getFile("Thing1");
        assert(!!f, "File should still exist");
        assert.equal(f.getContentSync(), "dogscontent");
    });

});
