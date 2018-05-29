import { goalContributors } from "../../../src/api/dsl/goalContribution";
import { whenPushSatisfies } from "../../../src/api/dsl/goalDsl";
import { HttpServiceGoals } from "../../../src/internal/delivery/goals/common/httpServiceGoals";
import { fakePush } from "./decisionTreeTest";

import * as assert from "power-assert";
import { Goals } from "../../../src/api/goal/Goals";
import { BuildGoal } from "../../../src/api/machine/wellKnownGoals";

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
