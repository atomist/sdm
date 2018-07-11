import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { InMemoryProject } from "@atomist/automation-client/project/mem/InMemoryProject";
import * as assert from "power-assert";
import { CachingProjectLoader, save } from "../../../src/api-helper/project/CachingProjectLoader";
import { SingleProjectLoader } from "../../../src/api-helper/test/SingleProjectLoader";

describe("cachingProjectLoader", () => {

    it("should load project", async () => {
        const id = new GitHubRepoRef("a", "b");
        const p = InMemoryProject.from(id);
        const pl = new SingleProjectLoader(p);
        const cp = new CachingProjectLoader(pl);
        const p1 = await save(cp, {id, credentials: null, readOnly: true});
        assert(p1 as any === p);
    });

});
