/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { InMemoryProject } from "@atomist/automation-client/project/mem/InMemoryProject";
import { TruePushTest } from "../../api/mapping/support/pushTestUtilsTest";

import * as assert from "power-assert";
import { executePushReactions } from "../../../src/api-helper/listener/executePushReactions";
import { fakeRunWithLogContext } from "../../../src/api-helper/test/fakeRunWithLogContext";
import { SingleProjectLoader } from "../../../src/api-helper/test/SingleProjectLoader";
import { PushListenerInvocation } from "../../../src/api/listener/PushListener";
import { PushReactionRegistration, PushReactionResponse } from "../../../src/api/registration/PushReactionRegistration";

function react(invocations: PushListenerInvocation[], stopTheWorld: boolean): PushReactionRegistration {
    return {
        name: "hatred",
        pushTest: TruePushTest,
        action: async cri => {
            invocations.push(cri);
            if (stopTheWorld) {
                return PushReactionResponse.failGoals;
            }
        },
    };
}

describe("executePushReactions", () => {

    it("stops the world", async () => {
        const id = new GitHubRepoRef("a", "b");
        const p = InMemoryProject.from(id);
        const invocations: PushListenerInvocation[] = [];
        const ge = executePushReactions(new SingleProjectLoader(p), [react(invocations, true)]);
        const r = await ge(fakeRunWithLogContext(id));
        assert.equal(invocations.length, 1);
        assert(!r.requireApproval);
        assert.equal(r.code, 1);
    });

    it("is invoked but doesn't stop the world", async () => {
        const id = new GitHubRepoRef("a", "b");
        const p = InMemoryProject.from(id);
        const invocations: PushListenerInvocation[] = [];
        const ge = executePushReactions(new SingleProjectLoader(p), [react(invocations, false)]);
        const r = await ge(fakeRunWithLogContext(id));
        assert.equal(invocations.length, 1);
        assert.equal(r.code, 0);
        assert(!r.requireApproval);
        assert.equal(r.code, 0);
    });

});
