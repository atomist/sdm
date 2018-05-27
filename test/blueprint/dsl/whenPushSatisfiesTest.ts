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

import * as assert from "power-assert";
import { whenPushSatisfies } from "../../../src/blueprint/dsl/goalDsl";
import { HttpServiceGoals } from "../../../src/common/delivery/goals/common/httpServiceGoals";
import { FalsePushTest, TruePushTest } from "../../common/listener/support/pushTestUtilsTest";
import { fakePush } from "./decisionTreeTest";

describe("whenPushSatisfies", () => {

    it("should satisfy true", async () => {
        const test = whenPushSatisfies(true).itMeans("war").setGoals(HttpServiceGoals);
        assert.equal(await test.mapping(fakePush()), HttpServiceGoals);
    });

    it("should not satisfy false", async () => {
        const test = whenPushSatisfies(false).itMeans("war").setGoals(HttpServiceGoals);
        assert.equal(await test.mapping(fakePush()), undefined);
    });

    it("should satisfy function returning true", async () => {
        const test = whenPushSatisfies(() => true).itMeans("war").setGoals(HttpServiceGoals);
        assert.equal(await test.mapping(fakePush()), HttpServiceGoals);
    });

    it("should not satisfy function returning false", async () => {
        const test = whenPushSatisfies(() => false).itMeans("war").setGoals(HttpServiceGoals);
        assert.equal(await test.mapping(fakePush()), undefined);
    });

    it("should satisfy function returning promise true", async () => {
        const test = whenPushSatisfies(async () => true).itMeans("war").setGoals(HttpServiceGoals);
        assert.equal(await test.mapping(fakePush()), HttpServiceGoals);
    });

    it("should allow setting array of goals", async () => {
        const test = whenPushSatisfies(async () => true).itMeans("war").setGoals(HttpServiceGoals.goals);
        assert.deepEqual((await test.mapping(fakePush())).goals, HttpServiceGoals.goals);
    });

    it("should not satisfy function returning promise false", async () => {
        const test = whenPushSatisfies(async () => false).itMeans("war").setGoals(HttpServiceGoals);
        assert.equal(await test.mapping(fakePush()), undefined);
    });

    it("should default name with one", async () => {
        const test = whenPushSatisfies(TruePushTest).setGoals(HttpServiceGoals);
        assert.equal(test.name, TruePushTest.name);
    });

    it("should override name with one", async () => {
        const test = whenPushSatisfies(TruePushTest).itMeans("something").setGoals(HttpServiceGoals);
        assert.equal(test.name, "something");
    });

    it("should default name with two", async () => {
        const test = whenPushSatisfies(TruePushTest, FalsePushTest).setGoals(HttpServiceGoals);
        assert.equal(test.name, TruePushTest.name + " && " + FalsePushTest.name);
    });

    it("should allow simple function", async () => {
        const test = whenPushSatisfies(async p => true).setGoals(HttpServiceGoals);
        assert.equal(await test.mapping(fakePush()), HttpServiceGoals);
    });

    it("should allow simple function returning false", async () => {
        const test = whenPushSatisfies(async p => p.push.id === "notThis").setGoals(HttpServiceGoals);
        assert.equal(await test.mapping(fakePush()), undefined);
    });
});
