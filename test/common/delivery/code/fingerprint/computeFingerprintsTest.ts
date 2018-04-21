import { CodeReactionInvocation, MavenFingerprinter } from "../../../../../src";
import { computeFingerprints } from "../../../../../src/common/delivery/code/fingerprint/computeFingerprints";

import { InMemoryProject } from "@atomist/automation-client/project/mem/InMemoryProject";
import * as assert from "power-assert";
import { InMemoryFile } from "@atomist/automation-client/project/mem/InMemoryFile";
import { computeShaOf } from "../../../../../src/util/misc/sha";
import { SimpleRepoId } from "@atomist/automation-client/operations/common/RepoId";

describe("computeFingerprints", () => {

    it("should execute none", async () => {
        const cri: CodeReactionInvocation = null;
        const r = await computeFingerprints(cri, []);
        assert(r.length === 0);
    });

    it("should execute one against empty project", async () => {
        const cri: CodeReactionInvocation = {project: InMemoryProject.of()} as any as CodeReactionInvocation;
        const r = await computeFingerprints(cri, [new MavenFingerprinter().action]);
        assert(r.length === 0);
    });

    it("should fingerprint with one", async () => {
        const cri: CodeReactionInvocation = {
            project: InMemoryProject.from(
                new SimpleRepoId("a", "b"),
                new InMemoryFile("thing", "1"))
        } as any as CodeReactionInvocation;
        const r = await computeFingerprints(cri, [async i => ({
            name: "foo",
            data: i.project.id.owner,
            sha: computeShaOf(i.project.id.owner),
            abbreviation: "xkc",
            version: "1.0",
        })]);
        assert(r.length === 1);
        assert.equal(r[0].data, "a");
    });

});
