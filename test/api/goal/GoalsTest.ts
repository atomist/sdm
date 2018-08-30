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
import { GoalWithPrecondition } from "../../../src/api/goal/Goal";
import { goals } from "../../../src/api/goal/Goals";
import {
    AutofixGoal,
    BuildGoal,
    CodeInspectionGoal,
    ProductionDeploymentGoal,
    StagingEndpointGoal,
} from "../../../src/api/machine/wellKnownGoals";

describe("GoalBuilder", () => {

    it("should construct simple goal set", () => {
        const simpleGoals = goals("Simple Goals")
            .plan(BuildGoal, AutofixGoal)
            .plan(StagingEndpointGoal);

        assert.strictEqual(simpleGoals.name, "Simple Goals");
        assert.strictEqual(simpleGoals.goals.length, 3);
    });

    it("should construct simple goal set with one pre condition", () => {
        const simpleGoals = goals("Simple Goals")
            .plan(BuildGoal.definition, AutofixGoal)
            .plan(StagingEndpointGoal).after(BuildGoal);

        assert.strictEqual(simpleGoals.name, "Simple Goals");
        assert.strictEqual(simpleGoals.goals.length, 3);

        const g = (simpleGoals.goals[2] as GoalWithPrecondition);

        assert.strictEqual(g.name, StagingEndpointGoal.name);
        assert.strictEqual(g.dependsOn.length, 1);
        assert.strictEqual(g.dependsOn[0].name, BuildGoal.name);
    });

    it("should construct goal set with pre conditions", () => {
        const simpleGoals = goals("Simple Goals")
            .plan(CodeInspectionGoal)
            .plan(BuildGoal, AutofixGoal.definition).after(CodeInspectionGoal)
            .plan(StagingEndpointGoal).after(BuildGoal)
            .plan(ProductionDeploymentGoal).after(BuildGoal, StagingEndpointGoal.definition);

        assert.strictEqual(simpleGoals.name, "Simple Goals");
        assert.strictEqual(simpleGoals.goals.length, 5);

        const buildGoal = simpleGoals.goals.find(g => g.name === BuildGoal.name) as GoalWithPrecondition;
        assert.strictEqual(buildGoal.name, BuildGoal.name);
        assert.strictEqual(buildGoal.dependsOn.length, 1);
        assert.strictEqual(buildGoal.dependsOn[0].name, CodeInspectionGoal.name);

        const autofixGoal = simpleGoals.goals.find(g => g.name === AutofixGoal.name) as GoalWithPrecondition;
        assert.strictEqual(autofixGoal.name, AutofixGoal.name);
        assert.strictEqual(autofixGoal.dependsOn.length, 1);
        assert.strictEqual(autofixGoal.dependsOn[0].name, CodeInspectionGoal.name);

        const stagingGoal = simpleGoals.goals.find(g => g.name === StagingEndpointGoal.name) as GoalWithPrecondition;
        assert.strictEqual(stagingGoal.name, StagingEndpointGoal.name);
        assert.strictEqual(stagingGoal.dependsOn.length, 1);
        assert.strictEqual(stagingGoal.dependsOn[0].name, BuildGoal.name);

        const prodGoal = simpleGoals.goals.find(g => g.name === ProductionDeploymentGoal.name) as GoalWithPrecondition;
        assert.strictEqual(prodGoal.name, ProductionDeploymentGoal.name);
        assert.strictEqual(prodGoal.dependsOn.length, 2);
        assert.strictEqual(prodGoal.dependsOn[0].name, BuildGoal.name);
        assert.strictEqual(prodGoal.dependsOn[1].name, StagingEndpointGoal.name);
    });
});
