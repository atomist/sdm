/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as assert from "power-assert";
import { HttpServiceGoals, whenPushSatisfies } from "../../../src";
import { fakePush } from "./decisionTreeTest";

describe("whenPushSatisfies", () => {

    it("should satisfy true", async () => {
        const test = await whenPushSatisfies(true).itMeans("war").setGoals(HttpServiceGoals);
        assert.equal(await test.valueForPush(fakePush()), HttpServiceGoals);
    });

    it("should not satisfy false", async () => {
        const test = await whenPushSatisfies(false).itMeans("war").setGoals(HttpServiceGoals);
        assert.equal(await test.valueForPush(fakePush()), undefined);
    });

    it("should satisfy function returning true", async () => {
        const test = await whenPushSatisfies(() => true).itMeans("war").setGoals(HttpServiceGoals);
        assert.equal(await test.valueForPush(fakePush()), HttpServiceGoals);
    });

    it("should not satisfy function returning false", async () => {
        const test = await whenPushSatisfies(() => false).itMeans("war").setGoals(HttpServiceGoals);
        assert.equal(await test.valueForPush(fakePush()), undefined);
    });

    it("should satisfy function returning promise true", async () => {
        const test = await whenPushSatisfies(async () => true).itMeans("war").setGoals(HttpServiceGoals);
        assert.equal(await test.valueForPush(fakePush()), HttpServiceGoals);
    });

    it("should not satisfy function returning promise false", async () => {
        const test = await whenPushSatisfies(async () => false).itMeans("war").setGoals(HttpServiceGoals);
        assert.equal(await test.valueForPush(fakePush()), undefined);
    });
});
