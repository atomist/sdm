import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import "mocha";
import * as assert from "power-assert";
import { PushTestInvocation } from "../../../../src/common/listener/GoalSetter";
import { ToPublicRepo } from "../../../../src/common/listener/support/pushTests";

describe("pushToPublicRepo", () => {

    it("should work against public repo", async () => {
        const id = new GitHubRepoRef("atomist", "github-sdm");
        const r = await ToPublicRepo({id} as any as PushTestInvocation);
        assert(r);
    });

    it("should work against private repo", async () => {
        const id = new GitHubRepoRef("atomisthq", "internal-automation");
        const r = await ToPublicRepo({id} as any as PushTestInvocation);
        assert(!r);
    });

});
