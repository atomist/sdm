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

import { GitHubRepoRef } from "@atomist/automation-client";

import * as assert from "assert";
import {
    pushTest,
    PushTest,
} from "../../../../lib/api/mapping/PushTest";
import { PushRules } from "../../../../lib/api/mapping/support/PushRules";
import {
    FalsePushTest,
    TruePushTest,
} from "./pushTestUtils.test";

export const UndefinedPushTest: PushTest = pushTest("true", async () => undefined);
export const NullPushTest: PushTest = pushTest("true", async () => null);

describe("PushRules", () => {
    
    const SomeRepoRef = {id: new GitHubRepoRef("a", "b")} as any;

    it("should be undefined none", async () => {
        const pr = new PushRules<string>("t1", []);
        assert.equal(await pr.mapping(SomeRepoRef), undefined);
    });

    it("should match true", async () => {
        const pr = new PushRules("t2", [TruePushTest]);
        assert(await pr.mapping(SomeRepoRef));
    });

    it("should be undefined on false", async () => {
        const pr = new PushRules("t3", [FalsePushTest]);
        const result = await pr.mapping(SomeRepoRef);
        assert.strictEqual(result, undefined);
    });

    it("should not match undefined", async () => {
        const pr = new PushRules("t4", [UndefinedPushTest]);
        const result = await pr.mapping(SomeRepoRef);
        assert.strictEqual(result, undefined);
    });

    it("should match undefined and true", async () => {
        const pr = new PushRules("t5", [UndefinedPushTest, TruePushTest]);
        const result = await pr.mapping(SomeRepoRef);
        assert(result);
    });

    it("should return undefined on null", async () => {
        const pr = new PushRules("t6", [NullPushTest]);
        const result = await pr.mapping(SomeRepoRef);
        assert.strictEqual(result, undefined);
    });

    it("should return undefined on null and true", async () => {
        const pr = new PushRules("t7", [NullPushTest, TruePushTest]);
        assert.strictEqual(await pr.mapping(SomeRepoRef), undefined);
    });

    it("should return defined on true and null", async () => {
        const pr = new PushRules("t8", [TruePushTest, NullPushTest]);
        const result = await pr.mapping(SomeRepoRef);
        assert(result);
    });

    it("should return undefined on false and null and true", async () => {
        const pr = new PushRules("t9", [FalsePushTest, NullPushTest, TruePushTest]);
        const result = await pr.mapping(SomeRepoRef);
        assert.strictEqual(result, undefined);
    });

});
