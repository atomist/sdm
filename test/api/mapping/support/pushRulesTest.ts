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

import * as assert from "power-assert";
import { PushTest, pushTest } from "../../../../src/api/mapping/PushTest";
import { PushRules } from "../../../../src/api/mapping/support/PushRules";
import { FalsePushTest, TruePushTest } from "./pushTestUtilsTest";

export const UndefinedPushTest: PushTest = pushTest("true", async () => undefined);
export const NullPushTest: PushTest = pushTest("true", async () => null);

describe("PushRules", () => {

    it("should be undefined none", async () => {
        const pr = new PushRules<string>("t1", []);
        assert.equal(await pr.mapping({id: new GitHubRepoRef("a", "b")} as any), undefined);
    });

    it("should match true", async () => {
        const pr = new PushRules("t2", [TruePushTest]);
        assert(await pr.mapping({id: new GitHubRepoRef("a", "b")} as any));
    });

    it("should be undefined on false", async () => {
        const pr = new PushRules("t3", [FalsePushTest]);
        assert.equal(await pr.mapping({id: new GitHubRepoRef("a", "b")} as any), undefined);
    });

    it("should not match undefined", async () => {
        const pr = new PushRules("t4", [UndefinedPushTest]);
        assert.equal(await pr.mapping({id: new GitHubRepoRef("a", "b")} as any), undefined);
    });

    it("should match undefined and true", async () => {
        const pr = new PushRules("t5", [UndefinedPushTest, TruePushTest]);
        assert(await pr.mapping({id: new GitHubRepoRef("a", "b")} as any));
    });

    it("should return undefined on null", async () => {
        const pr = new PushRules("t6", [NullPushTest]);
        assert.equal(await pr.mapping({id: new GitHubRepoRef("a", "b")} as any), undefined);
    });

    it("should return undefined on null and true", async () => {
        const pr = new PushRules("t7", [NullPushTest, TruePushTest]);
        assert.equal(await pr.mapping({id: new GitHubRepoRef("a", "b")} as any), undefined);
    });

    it("should return defined on true and null", async () => {
        const pr = new PushRules("t8", [TruePushTest, NullPushTest]);
        assert(await pr.mapping({id: new GitHubRepoRef("a", "b")} as any));
    });

    it("should return undefined on false and null and true", async () => {
        const pr = new PushRules("t9", [FalsePushTest, NullPushTest, TruePushTest]);
        assert.equal(await pr.mapping({id: new GitHubRepoRef("a", "b")} as any), undefined);
    });

});
