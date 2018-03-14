import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import "mocha";
import * as assert from "power-assert";
import { mavenFingerprinter } from "../../../../../../../src/handlers/events/delivery/scan/fingerprint/maven/mavenFingerprinter";

describe("mavenFingerprinter", () => {

    it("should find some dependencies", async () => {
        const Seed = await GitCommandGitProject.cloned({token: null},
            new GitHubRepoRef("atomist-seeds", "spring-rest-seed"));
        const fp = await mavenFingerprinter(Seed);
        const f1 = JSON.parse(fp[0].data);
        assert(f1.length > 0);
        f1.forEach(f => assert(f.groupId === "org.springframework.boot"));
    }).timeout(10000);

});
