import "mocha";
import { SingleProjectLoader } from "../../../SingleProjectLoader";
import { executeAutofixes } from "../../../../../src/common/delivery/code/autofix/executeAutofixes";
import * as assert from "power-assert";
import { fakeRunWithLogContext } from "../../../../../src/common/delivery/code/fakeRunWithLogContext";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";

describe("executeAutofixes", () => {

    it("should execute none", async() => {
        const id = new GitHubRepoRef("a", "b");
        const pl = new SingleProjectLoader({ id } as any);
        const r = await executeAutofixes(pl, [])(fakeRunWithLogContext(id));
        assert(r.code === 0);
    });

});
