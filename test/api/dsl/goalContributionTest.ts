import { goalContributors } from "../../../src/api/dsl/goalContribution";
import { whenPushSatisfies } from "../../../src/api/dsl/goalDsl";
import { HttpServiceGoals } from "../../../src/goal/common/httpServiceGoals";
import { fakePush } from "./decisionTreeTest";

import * as assert from "power-assert";
import { enrichGoalSetters, GoalComponent, GoalSetter, MessageGoal } from "../../../src";
import { Goals } from "../../../src/api/goal/Goals";
import { BuildGoal } from "../../../src/api/machine/wellKnownGoals";

describe("goalContribution", () => {

    describe("goalContributors", () => {

        it("should set no goals", async () => {
            const gs = goalContributors(whenPushSatisfies(false).itMeans("thing").setGoals(HttpServiceGoals));
            const p = fakePush();
            const goals: Goals = await gs.mapping(p);
            assert.equal(goals, undefined);
        });

        it("should set goals from one goal", async () => {
            const gs = goalContributors(whenPushSatisfies(true).itMeans("thing").setGoals(BuildGoal));
            const p = fakePush();
            const goals: Goals = await gs.mapping(p);
            assert.deepEqual(goals.goals, [BuildGoal]);
        });

        it("should set goals from one goals", async () => {
            const r = whenPushSatisfies(true).setGoals(HttpServiceGoals);
            const gs = goalContributors(r);
            const p = fakePush();
            assert.equal(await r.mapping(p), HttpServiceGoals);
            const goals: Goals = await gs.mapping(p);
            assert.deepEqual(goals.goals, HttpServiceGoals.goals);
        });

    });

    describe("enrichGoalSetters", () => {

        it("should set no goals", async () => {
            const gs: GoalSetter = enrichGoalSetters(whenPushSatisfies(false).itMeans("thing").setGoals(HttpServiceGoals),
                whenPushSatisfies(false).setGoals(HttpServiceGoals));
            const p = fakePush();
            const goals: Goals = await gs.mapping(p);
            assert.equal(goals, undefined);
        });

        it("should add goal to none", async () => {
            const gs: GoalSetter = enrichGoalSetters(whenPushSatisfies(false).itMeans("thing").setGoals(HttpServiceGoals),
                whenPushSatisfies(true).setGoals(HttpServiceGoals));
            const p = fakePush();
            const goals: Goals = await gs.mapping(p);
            assert.deepEqual(goals.goals, HttpServiceGoals.goals);
        });

        it("should add goal to some", async () => {
            // TODO what is the problem with MessageGoal and type checking??
            const old: GoalSetter = whenPushSatisfies(true).itMeans("thing").setGoals(HttpServiceGoals);
            const gs: GoalSetter = enrichGoalSetters(old,
                whenPushSatisfies(true).setGoals(MessageGoal as any as GoalComponent));
            const p = fakePush();
            const goals: Goals = await gs.mapping(p);
            assert.deepEqual(goals.goals, HttpServiceGoals.goals.concat(MessageGoal as any));
        });

    });
});
