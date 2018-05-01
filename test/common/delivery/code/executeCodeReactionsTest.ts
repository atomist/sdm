import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { InMemoryProject } from "@atomist/automation-client/project/mem/InMemoryProject";
import { CodeActionRegistration, CodeActionResponse, executeCodeReactions, PushListenerInvocation, SingleProjectLoader } from "../../../../src";
import { fakeRunWithLogContext } from "../../../../src/util/test/fakeRunWithLogContext";
import { TruePushTest } from "../../listener/support/pushTestUtilsTest";

import * as assert from "power-assert";

function react(invocations: PushListenerInvocation[], stopTheWorld: boolean): CodeActionRegistration {
    return {
        name: "hatred",
        pushTest: TruePushTest,
        action: async cri => {
            invocations.push(cri);
            if (stopTheWorld) {
                return CodeActionResponse.failGoals;
            }
        },
    };
}

describe("executeCodeReactions", () => {

    it("stops the world", async () => {
        const id = new GitHubRepoRef("a", "b");
        const p = InMemoryProject.from(id);
        const invocations: PushListenerInvocation[] = [];
        const ge = executeCodeReactions(new SingleProjectLoader(p), [react(invocations, true)]);
        const r = await ge(fakeRunWithLogContext(id));
        assert.equal(invocations.length, 1);
        assert(!r.requireApproval);
        assert.equal(r.code, 1);
    });

    it("is invoked but doesn't stop the world", async () => {
        const id = new GitHubRepoRef("a", "b");
        const p = InMemoryProject.from(id);
        const invocations: PushListenerInvocation[] = [];
        const ge = executeCodeReactions(new SingleProjectLoader(p), [react(invocations, false)]);
        const r = await ge(fakeRunWithLogContext(id));
        assert.equal(invocations.length, 1);
        assert.equal(r.code, 0);
        assert(!r.requireApproval);
        assert.equal(r.code, 0);
    });

});
