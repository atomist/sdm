import * as assert from "power-assert";
import {
    AutofixGoal,
    BuildGoal,
    goals,
    GoalWithPrecondition,
    ProductionDeploymentGoal,
    ReviewGoal,
    StagingEndpointGoal,
} from "../../../src";

describe("GoalBuilder", () => {

    it("should construct simple goal set", () => {
        const simpleGoals = goals("Simple Goals")
            .execute(BuildGoal, AutofixGoal)
            .execute(StagingEndpointGoal);

        assert.equal(simpleGoals.name, "Simple Goals");
        assert.equal(simpleGoals.goals.length, 3);
    });

    it("should construct simple goal set with one pre condition", () => {
        const simpleGoals = goals("Simple Goals")
            .execute(BuildGoal, AutofixGoal)
            .execute(StagingEndpointGoal).after(BuildGoal);

        assert.equal(simpleGoals.name, "Simple Goals");
        assert.equal(simpleGoals.goals.length, 3);

        const g = (simpleGoals.goals[2] as GoalWithPrecondition);

        assert.equal(g.name, StagingEndpointGoal.name);
        assert.equal(g.dependsOn.length, 1);
        assert.equal(g.dependsOn[0].name, BuildGoal.name);
    });

    it("should construct goal set with pre conditions", () => {
        const simpleGoals = goals("Simple Goals")
            .execute(ReviewGoal)
            .execute(BuildGoal, AutofixGoal).after(ReviewGoal)
            .execute(StagingEndpointGoal).after(BuildGoal)
            .execute(ProductionDeploymentGoal).after(BuildGoal, StagingEndpointGoal);

        assert.equal(simpleGoals.name, "Simple Goals");
        assert.equal(simpleGoals.goals.length, 5);

        const buildGoal = simpleGoals.goals.find(g => g.name === BuildGoal.name) as GoalWithPrecondition;
        assert.equal(buildGoal.name, buildGoal.name);
        assert.equal(buildGoal.dependsOn.length, 1);
        assert.equal(buildGoal.dependsOn[0].name, ReviewGoal.name);

        const autofixGoal = simpleGoals.goals.find(g => g.name === AutofixGoal.name) as GoalWithPrecondition;
        assert.equal(autofixGoal.name, AutofixGoal.name);
        assert.equal(autofixGoal.dependsOn.length, 1);
        assert.equal(autofixGoal.dependsOn[0].name, ReviewGoal.name);

        const stagingGoal = simpleGoals.goals.find(g => g.name === StagingEndpointGoal.name) as GoalWithPrecondition;
        assert.equal(stagingGoal.name, StagingEndpointGoal.name);
        assert.equal(stagingGoal.dependsOn.length, 1);
        assert.equal(stagingGoal.dependsOn[0].name, BuildGoal.name);

        const prodGoal = simpleGoals.goals.find(g => g.name === ProductionDeploymentGoal.name) as GoalWithPrecondition;
        assert.equal(prodGoal.name, ProductionDeploymentGoal.name);
        assert.equal(prodGoal.dependsOn.length, 2);
        assert.equal(prodGoal.dependsOn[0].name, BuildGoal.name);
        assert.equal(prodGoal.dependsOn[1].name, StagingEndpointGoal.name);
    });
});