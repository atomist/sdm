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

import { enrichGoalSetters, goalContributors } from "../../../src/api/dsl/goalContribution";
import { whenPushSatisfies } from "../../../src/api/dsl/goalDsl";

import * as assert from "power-assert";
import { AutofixGoal, FingerprintGoal, onAnyPush, PushReactionGoal, ReviewGoal } from "../../../src";
import { fakePush } from "../../../src/api-helper/test/fakePush";
import { GoalComponent } from "../../../src/api/dsl/GoalComponent";
import { MessageGoal } from "../../../src/api/goal/common/MessageGoal";
import { Goal } from "../../../src/api/goal/Goal";
import { Goals } from "../../../src/api/goal/Goals";
import { BuildGoal } from "../../../src/api/machine/wellKnownGoals";
import { GoalSetter } from "../../../src/api/mapping/GoalSetter";
import { TestSoftwareDeliveryMachine } from "../../api-helper/TestSoftwareDeliveryMachine";

const SomeGoalSet = new Goals("SomeGoalSet", new Goal({
    uniqueName: "Fred",
    environment: "0-code/", orderedName: "0-Fred",
}));

describe("goalContribution", () => {

    describe("goalContributors", () => {

        it("should set no goals", async () => {
            const gs = goalContributors(whenPushSatisfies(() => false).itMeans("thing").setGoals(SomeGoalSet));
            const p = fakePush();
            const goals: Goals = await gs.mapping(p);
            assert.equal(goals, undefined);
        });

        it("should set goals from one goal", async () => {
            const gs = goalContributors(whenPushSatisfies(() => true).itMeans("thing").setGoals(BuildGoal));
            const p = fakePush();
            const goals: Goals = await gs.mapping(p);
            assert.deepEqual(goals.goals, [BuildGoal]);
        });

        it("should set goals from one goals", async () => {
            const r = whenPushSatisfies(() => true).setGoals(SomeGoalSet);
            const gs = goalContributors(r);
            const p = fakePush();
            assert.equal(await r.mapping(p), SomeGoalSet);
            const goals: Goals = await gs.mapping(p);
            assert.deepEqual(goals.goals, SomeGoalSet.goals);
        });

    });

    describe("enrichGoalSetters", () => {

        it("should set no goals", async () => {
            const gs: GoalSetter = enrichGoalSetters(whenPushSatisfies(() => false).itMeans("thing").setGoals(SomeGoalSet),
                whenPushSatisfies(() => false).setGoals(SomeGoalSet));
            const p = fakePush();
            const goals: Goals = await gs.mapping(p);
            assert.equal(goals, undefined);
        });

        it("should add goal to none", async () => {
            const gs: GoalSetter = enrichGoalSetters(whenPushSatisfies(() => false).itMeans("thing").setGoals(SomeGoalSet),
                whenPushSatisfies(() => true).setGoals(SomeGoalSet));
            const p = fakePush();
            const goals: Goals = await gs.mapping(p);
            assert.deepEqual(goals.goals, SomeGoalSet.goals);
        });

        it("should add goal to some", async () => {
            // TODO what is the problem with MessageGoal and type checking??
            const old: GoalSetter = whenPushSatisfies(() => true).itMeans("thing").setGoals(SomeGoalSet);
            const gs: GoalSetter = enrichGoalSetters(old,
                onAnyPush().setGoals(MessageGoal as any as GoalComponent));
            const p = fakePush();
            const goals: Goals = await gs.mapping(p);
            assert.deepEqual(goals.goals, SomeGoalSet.goals.concat(MessageGoal as any));
        });

        it("should add two goals to some", async () => {
            const old: GoalSetter = whenPushSatisfies(() => true).itMeans("thing").setGoals(SomeGoalSet);
            let gs: GoalSetter = enrichGoalSetters(old,
                onAnyPush().setGoals(MessageGoal as any as GoalComponent));
            gs = enrichGoalSetters(gs,
                onAnyPush().setGoals(FingerprintGoal as any as GoalComponent));
            const p = fakePush();
            const goals: Goals = await gs.mapping(p);
            assert.equal(goals.goals.length, 3);
            assert.deepEqual(goals.goals, SomeGoalSet.goals.concat([MessageGoal, FingerprintGoal] as any));
        });

    });

    describe("using SDM", () => {

        it("should accept and add with () => true", async () => {
            const sdm = new TestSoftwareDeliveryMachine("test");
            sdm.addGoalContributions(goalContributors(
                onAnyPush().setGoals(new Goals("Checks", ReviewGoal, PushReactionGoal, AutofixGoal))));
            const p = fakePush();
            const goals: Goals = await sdm.pushMapping.mapping(p);
            assert.deepEqual(goals.goals.sort(), [ReviewGoal, PushReactionGoal, AutofixGoal].sort());
            sdm.addGoalContributions(whenPushSatisfies(() => true).setGoals(FingerprintGoal));
            const goals2: Goals = await sdm.pushMapping.mapping(p);
            assert.deepEqual(goals2.goals.sort(), [ReviewGoal, PushReactionGoal, AutofixGoal, FingerprintGoal].sort());
        });

        it("should accept and add with onAnyPush", async () => {
            const sdm = new TestSoftwareDeliveryMachine("test");
            sdm.addGoalContributions(goalContributors(
                onAnyPush().setGoals(new Goals("Checks", ReviewGoal, PushReactionGoal, AutofixGoal))));
            const p = fakePush();
            const goals: Goals = await sdm.pushMapping.mapping(p);
            assert.deepEqual(goals.goals.sort(), [ReviewGoal, PushReactionGoal, AutofixGoal].sort());
            sdm.addGoalContributions(onAnyPush().setGoals(FingerprintGoal));
            const goals2: Goals = await sdm.pushMapping.mapping(p);
            assert.deepEqual(goals2.goals.sort(), [ReviewGoal, PushReactionGoal, AutofixGoal, FingerprintGoal].sort());
        });
    });
});
