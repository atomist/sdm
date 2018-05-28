import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { InMemoryProject } from "@atomist/automation-client/project/mem/InMemoryProject";
import * as assert from "power-assert";
import { copyFileFromUrl, copyFilesFrom } from "../../../src/util/project/fileCopy";

describe("fileCopy", () => {

    it("should copy file from url", async () => {
        const recipient = InMemoryProject.of();
        await (copyFileFromUrl("https://raw.githubusercontent.com/spring-team/spring-rest-seed/master/pom.xml", "pom.xml"))(recipient);
        assert(!!(await recipient.getFile("pom.xml")));
    }).timeout(5000);

    it("should copy file from donor project", async () => {
        const donorId = new GitHubRepoRef("spring-team", "spring-rest-seed");
        const filesToSteal = [ "pom.xml"];
        const recipient = InMemoryProject.of();
        await (copyFilesFrom(donorId, filesToSteal, { token: process.env.GITHUB_TOKEN}))(recipient);
        assert(!!(await recipient.getFile(filesToSteal[0])));
    }).timeout(5000);

    it("should copy file from donor project with mapping", async () => {
        const donorId = new GitHubRepoRef("spring-team", "spring-rest-seed");
        const filesToSteal = [ { donorPath: "pom.xml", recipientPath: "foo" }];
        const recipient = InMemoryProject.of();
        await (copyFilesFrom(donorId, filesToSteal, { token: process.env.GITHUB_TOKEN}))(recipient);
        assert(!(await recipient.getFile(filesToSteal[0].donorPath)));
        assert(!!(await recipient.getFile(filesToSteal[0].recipientPath)));
    }).timeout(5000);
});
