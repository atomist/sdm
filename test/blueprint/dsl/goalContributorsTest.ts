import { goalContributors } from "../../../src/blueprint/dsl/goalContribution";
import { whenPushSatisfies } from "../../../src/blueprint/dsl/goalDsl";
import { HttpServiceGoals } from "../../../src/common/delivery/goals/common/httpServiceGoals";
import { fakePush } from "./decisionTreeTest";

import * as assert from "power-assert";
import { BuildGoal } from "../../../src/blueprint/wellKnownGoals";
import { Goals } from "../../../src/common/delivery/goals/Goals";

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
