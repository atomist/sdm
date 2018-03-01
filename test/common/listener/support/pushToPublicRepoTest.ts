import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import "mocha";
import * as assert from "power-assert";
import { PhaseCreationInvocation } from "../../../../src/common/listener/PhaseCreator";
import { PushToPublicRepo } from "../../../../src/common/listener/support/pushTests";

describe("pushToPublicRepo", () => {

    it("should work against public repo", async () => {
        const id = new GitHubRepoRef("atomist", "github-sdm");
        const r = await PushToPublicRepo({id} as any as PhaseCreationInvocation);
        assert(r);
    });

    it("should work against private repo", async () => {
        const id = new GitHubRepoRef("atomisthq", "internal-automation");
        const r = await PushToPublicRepo({id} as any as PhaseCreationInvocation);
        assert(!r);
    });

});
