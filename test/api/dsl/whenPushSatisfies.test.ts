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
import { fakePush } from "../../../lib/api-helper/testsupport/fakePush";
import { StatefulPushListenerInvocation } from "../../../lib/api/dsl/goalContribution";
import { whenPushSatisfies } from "../../../lib/api/dsl/goalDsl";
import { Goal } from "../../../lib/api/goal/Goal";
import { Goals } from "../../../lib/api/goal/Goals";
import {
    PredicateMappingCompositionStyle,
} from "../../../lib/api/mapping/PredicateMapping";
import { allSatisfied } from "../../../lib/api/mapping/support/pushTestUtils";
import {
    FalsePushTest,
    TruePushTest,
} from "../mapping/support/pushTestUtils.test";

const SomeGoalSet = new Goals("SomeGoalSet", new Goal({
    uniqueName: "Fred",
    environment: "0-code/", orderedName: "0-Fred",
}));

describe("whenPushSatisfies", () => {

    describe("basic operation", () => {

        it("should satisfy function returning true", async () => {
            const test = whenPushSatisfies(() => true).itMeans("war").setGoals(SomeGoalSet);
            assert.equal(await test.mapping(fakePush()), SomeGoalSet);
        });

        it("should not satisfy function returning false", async () => {
            const test = whenPushSatisfies(() => false).itMeans("war").setGoals(SomeGoalSet);
            assert.equal(await test.mapping(fakePush()), undefined);
        });

        it("should satisfy function returning promise true", async () => {
            const test = whenPushSatisfies(async () => true).itMeans("war").setGoals(SomeGoalSet);
            assert.equal(await test.mapping(fakePush()), SomeGoalSet);
        });

        it("should allow setting array of goals", async () => {
            const test = whenPushSatisfies(async () => true).itMeans("war").setGoals(SomeGoalSet.goals);
            assert.deepEqual((await test.mapping(fakePush())).goals, SomeGoalSet.goals);
        });

        it("should not satisfy function returning promise false", async () => {
            const test = whenPushSatisfies(async () => false).itMeans("war").setGoals(SomeGoalSet);
            assert.equal(await test.mapping(fakePush()), undefined);
        });

        it("should default name with one", async () => {
            const test = whenPushSatisfies(TruePushTest).setGoals(SomeGoalSet);
            assert.equal(test.name, TruePushTest.name);
        });

        it("should override name with one", async () => {
            const test = whenPushSatisfies(TruePushTest).itMeans("something").setGoals(SomeGoalSet);
            assert.equal(test.name, "something");
        });

        it("should default name with two", async () => {
            const test = whenPushSatisfies(TruePushTest, FalsePushTest).setGoals(SomeGoalSet);
            assert.equal(test.name, TruePushTest.name + " && " + FalsePushTest.name);
        });

        it("should allow simple function", async () => {
            const test = whenPushSatisfies(async p => true).setGoals(SomeGoalSet);
            assert.equal(await test.mapping(fakePush()), SomeGoalSet);
        });

        it("should allow simple function returning false", async () => {
            const test = whenPushSatisfies(async p => p.push.id === "notThis").setGoals(SomeGoalSet);
            assert.equal(await test.mapping(fakePush()), undefined);
        });

        it("should allow use of push in constructing goal", async () => {
            interface Named { name: string; }
            const test = whenPushSatisfies<StatefulPushListenerInvocation<Named>>(async () => true)
                .setGoalsWhen(pu => {
                    if (pu.facts.name === "fred") {
                        return SomeGoalSet;
                    }
                    throw new Error("bad");
                });
            const invocation: StatefulPushListenerInvocation<Named> = fakePush();
            invocation.facts = {} as any;
            invocation.facts.name = "fred";
            assert.equal(await test.mapping(invocation), SomeGoalSet);
        });

    });

    describe("internal structure", () => {

        it("should expose structure", async () => {
            const wps = whenPushSatisfies(TruePushTest, FalsePushTest).setGoals(SomeGoalSet);
            const structure = wps.pushTest.structure;
            assert(!!structure);
            assert.equal(structure.compositionStyle, PredicateMappingCompositionStyle.And);
            assert.equal(structure.components.length, 2);
        });

        it("should expose nested structure", async () => {
            const wps = whenPushSatisfies(allSatisfied(TruePushTest, FalsePushTest), FalsePushTest).setGoals(SomeGoalSet);
            const structure = wps.pushTest.structure;
            assert(!!structure);
            assert.equal(structure.compositionStyle, PredicateMappingCompositionStyle.And);
            assert.equal(structure.components.length, 2);
        });

    });
});
