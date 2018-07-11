import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { Project } from "@atomist/automation-client/project/Project";
import { doWithFiles } from "@atomist/automation-client/project/util/projectUtils";
import * as assert from "power-assert";
import { save } from "../../../src/api-helper/project/CachingProjectLoader";
import { CloningProjectLoader } from "../../../src/api-helper/project/cloningProjectLoader";
import { LazyProjectLoader } from "../../../src/api-helper/project/LazyProjectLoader";

const credentials = {
    token: process.env.GITHUB_TOKEN,
};

describe("LazyProjectLoader", () => {

    it("should not need to load for name or id", async () => {
        const id = new GitHubRepoRef("this.is.invalid", "nonsense");
        const lpl = new LazyProjectLoader(CloningProjectLoader);
        const p: Project = await save(lpl, { credentials, id, readOnly: false });
        assert.equal(p.name, id.repo);
        assert.equal(p.id, id);
    });

    it("should get file first", async () => {
        const id = new GitHubRepoRef("spring-team", "spring-rest-seed");
        const lpl = new LazyProjectLoader(CloningProjectLoader);
        const p: Project = await save(lpl, { credentials, id, readOnly: false });
        const f1 = await p.getFile("not-there");
        assert(!f1);
        const pom = await p.getFile("pom.xml");
        assert(!!pom.getContentSync());
    }).timeout(10000);

    it("should get file after stream", async () => {
        const id = new GitHubRepoRef("spring-team", "spring-rest-seed");
        const lpl = new LazyProjectLoader(CloningProjectLoader);
        const p: Project = await save(lpl, { credentials, id, readOnly: false });
        let count = 0;
        await doWithFiles(p, "**", f => {
            // tslint:disable-next-line:no-console
            ++count;
            assert(!!f.getContentSync());
        });
        assert(count > 0);
        const f1 = await p.getFile("not-there");
        assert(!f1);
        const pom = await p.getFile("pom.xml");
        assert(!!pom.getContentSync());
    }).timeout(10000);

    it("should load for files", async () => {
        const id = new GitHubRepoRef("spring-team", "spring-rest-seed");
        const lpl = new LazyProjectLoader(CloningProjectLoader);
        const p: Project = await save(lpl, { credentials, id, readOnly: false });
        let count = 0;
        await doWithFiles(p, "**", f => {
            // tslint:disable-next-line:no-console
            ++count;
            assert(!!f.getContentSync());
        });
        assert(count > 0);
    }).timeout(10000);
});
