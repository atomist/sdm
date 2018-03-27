import "mocha";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { filtered } from "../../../src/util/project/filter";

import * as assert from "power-assert";

describe("Project filtered", () => {

    it("should copy to empty", async () => {
        const p = await GitCommandGitProject.cloned({ token: null}, new GitHubRepoRef("atomist-seeds", "spring-rest-seed"));
        const copied = await filtered(p, []);
        assert.equal(0, await copied.totalFileCount());
    });

    it("should copy one", async () => {
        const p = await GitCommandGitProject.cloned({ token: null}, new GitHubRepoRef("atomist-seeds", "spring-rest-seed"));
        const copied = await filtered(p, ["pom.xml"]);
        assert.equal(1, await copied.totalFileCount());
        await copied.findFile("pom.xml");
    });

});