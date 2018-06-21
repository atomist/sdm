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

import { given } from "../../../src/api/dsl/decisionTree";
import { FalsePushTest, TruePushTest } from "../mapping/support/pushTestUtilsTest";

import { Project } from "@atomist/automation-client/project/Project";
import * as assert from "power-assert";
import { fakeContext } from "../../../src/api-helper/test/fakeContext";
import { whenPushSatisfies } from "../../../src/api/dsl/goalDsl";
import { Goal } from "../../../src/api/goal/Goal";
import { Goals } from "../../../src/api/goal/Goals";
import { PushListenerInvocation } from "../../../src/api/listener/PushListener";
import { PushMapping } from "../../../src/api/mapping/PushMapping";

const FrogPushMapping: PushMapping<string> = {
    name: "frog",
    mapping: async () => "frog",
};

export function fakePush(project?: Project): PushListenerInvocation {
    return {
        push: {id: new Date().getTime() + "_"},
        project,
        context: fakeContext(),
    } as any as PushListenerInvocation;
}

const SomeGoalSet = new Goals("SomeGoalSet", new Goal({
    uniqueName: "Fred",
    environment: "0-code/", orderedName: "0-Fred",
}));

const NoGoals = new Goals("No goals");

describe("given", () => {

    it("should combine true with one", async () => {
        const pm: PushMapping<any> = given(TruePushTest)
            .itMeans("frogs coming")
            .then(FrogPushMapping);
        const mapped = await pm.mapping(fakePush());
        assert.equal(mapped, "frog");
    });

    it("should combine false with one", async () => {
        const pm: PushMapping<any> = given(FalsePushTest)
            .itMeans("no frogs coming")
            .then(FrogPushMapping);
        const mapped = await pm.mapping(fakePush());
        assert.equal(mapped, undefined);
    });

    it("allows multiple given guards", async () => {
        const pm: PushMapping<string> = given<string>(TruePushTest, TruePushTest)
            .itMeans("frogs coming")
            .then(FrogPushMapping);
        const mapped = await pm.mapping(fakePush());
        assert.equal(mapped, "frog");
    });

    it("should allow literal", async () => {
        const pm: PushMapping<string> = given<string>(TruePushTest)
            .itMeans("frogs coming")
            .set("frogs");
        const mapped = await pm.mapping(fakePush());
        assert.equal(mapped, "frogs");
    });

    it("nest with when", async () => {
        const pm: PushMapping<Goals> = given<Goals>(TruePushTest)
            .itMeans("no frogs coming")
            .then(
                whenPushSatisfies(TruePushTest).itMeans("http").setGoals(SomeGoalSet),
            );
        const mapped = await pm.mapping(fakePush());
        assert.equal(mapped, SomeGoalSet);
    });

    it("nest with multiple when", async () => {
        const pm: PushMapping<Goals> = given<Goals>(TruePushTest)
            .itMeans("no frogs coming")
            .then(
                whenPushSatisfies(FalsePushTest).itMeans("nope").setGoals(NoGoals),
                whenPushSatisfies(TruePushTest).itMeans("yes").setGoals(SomeGoalSet),
            );
        const mapped = await pm.mapping(fakePush());
        assert.equal(mapped, SomeGoalSet);
    });

    it("nested given", async () => {
        const pm: PushMapping<Goals> = given<Goals>(TruePushTest)
            .itMeans("no frogs coming")
            .then(
                given<Goals>(TruePushTest).itMeans("case1").then(
                    whenPushSatisfies(FalsePushTest).itMeans("nope").setGoals(NoGoals),
                    whenPushSatisfies(TruePushTest).itMeans("yes").setGoals(SomeGoalSet),
                ),
            );
        const mapped = await pm.mapping(fakePush());
        assert.equal(mapped, SomeGoalSet);
    });

    it("nested given with variable", async () => {
        let count = 0;
        const pm: PushMapping<Goals> = given<Goals>(TruePushTest)
            .init(() => count = 0)
            .itMeans("no frogs coming")
            .then(
                given<Goals>(TruePushTest).itMeans("case1")
                    .compute(() => count++)
                    .then(
                        whenPushSatisfies(() => count > 0, FalsePushTest).itMeans("nope").setGoals(NoGoals),
                        whenPushSatisfies(TruePushTest).itMeans("yes").setGoals(SomeGoalSet),
                    ),
            );
        const mapped = await pm.mapping(fakePush());
        assert.equal(mapped, SomeGoalSet);
    });
});
