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
import { AutoCodeInspection } from "../../../lib/api/goal/common/AutoCodeInspection";
import { Autofix } from "../../../lib/api/goal/common/Autofix";
import { Fingerprint } from "../../../lib/api/goal/common/Fingerprint";
import { PushImpact } from "../../../lib/api/goal/common/PushImpact";
import { GoalWithPrecondition } from "../../../lib/api/goal/Goal";
import { goals } from "../../../lib/api/goal/Goals";
import {
    goal,
    GoalWithFulfillment,
} from "../../../lib/api/goal/GoalWithFulfillment";

const ArtifactGoal = new GoalWithFulfillment({
    uniqueName: "artifact",
});
const AutofixGoal = new Autofix();
const BuildGoal = new GoalWithFulfillment({
    uniqueName: "build",
});
const FingerprintGoal = new Fingerprint();
const PushImpactGoal = new PushImpact();
const CodeInspectionGoal = new AutoCodeInspection();

describe("GoalBuilder", () => {

    it("should construct simple goal set", () => {
        const simpleGoals = goals("Simple Goals")
            .plan(BuildGoal, AutofixGoal)
            .plan(FingerprintGoal);

        assert.strictEqual(simpleGoals.name, "Simple Goals");
        assert.strictEqual(simpleGoals.goals.length, 3);
    });

    it("should construct simple goal set with one pre condition", () => {
        const simpleGoals = goals("Simple Goals")
            .plan(BuildGoal.definition, AutofixGoal)
            .plan(FingerprintGoal).after(BuildGoal);

        assert.strictEqual(simpleGoals.name, "Simple Goals");
        assert.strictEqual(simpleGoals.goals.length, 3);

        const g = (simpleGoals.goals[2] as GoalWithPrecondition);

        assert.strictEqual(g.name, FingerprintGoal.name);
        assert.strictEqual(g.dependsOn.length, 1);
        assert.strictEqual(g.dependsOn[0].name, BuildGoal.name);
    });

    it("should construct goal set with pre conditions", () => {
        const simpleGoals = goals("Simple Goals")
            .plan(CodeInspectionGoal)
            .plan(BuildGoal, AutofixGoal.definition).after(CodeInspectionGoal)
            .plan(FingerprintGoal).after(BuildGoal)
            .plan(PushImpactGoal).after(BuildGoal, FingerprintGoal.definition);

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

        const stagingGoal = simpleGoals.goals.find(g => g.name === FingerprintGoal.name) as GoalWithPrecondition;
        assert.strictEqual(stagingGoal.name, FingerprintGoal.name);
        assert.strictEqual(stagingGoal.dependsOn.length, 1);
        assert.strictEqual(stagingGoal.dependsOn[0].name, BuildGoal.name);

        const prodGoal = simpleGoals.goals.find(g => g.name === PushImpactGoal.name) as GoalWithPrecondition;
        assert.strictEqual(prodGoal.name, PushImpactGoal.name);
        assert.strictEqual(prodGoal.dependsOn.length, 2);
        assert.strictEqual(prodGoal.dependsOn[0].name, BuildGoal.name);
        assert.strictEqual(prodGoal.dependsOn[1].name, FingerprintGoal.name);
    });

    it("should construct goal sets with pre conditions", () => {
        const baseGoals = goals("Base Goals")
            .plan(CodeInspectionGoal)
            .plan(AutofixGoal.definition).after(CodeInspectionGoal);

        const simpleGoals = goals("Simple Goals")
            .plan(BuildGoal).after(baseGoals)
            .plan(FingerprintGoal).after(BuildGoal)
            .plan(CodeInspectionGoal).after(BuildGoal, FingerprintGoal.definition);

        assert.strictEqual(simpleGoals.name, "Simple Goals");
        assert.strictEqual(simpleGoals.goals.length, 3);

        const buildGoal = simpleGoals.goals.find(g => g.name === BuildGoal.name) as GoalWithPrecondition;
        assert.strictEqual(buildGoal.name, BuildGoal.name);
        assert.strictEqual(buildGoal.dependsOn.length, 2);
        assert.strictEqual(buildGoal.dependsOn[0].name, CodeInspectionGoal.name);

        const stagingGoal = simpleGoals.goals.find(g => g.name === FingerprintGoal.name) as GoalWithPrecondition;
        assert.strictEqual(stagingGoal.name, FingerprintGoal.name);
        assert.strictEqual(stagingGoal.dependsOn.length, 1);
        assert.strictEqual(stagingGoal.dependsOn[0].name, BuildGoal.name);

        const prodGoal = simpleGoals.goals.find(g => g.name === CodeInspectionGoal.name) as GoalWithPrecondition;
        assert.strictEqual(prodGoal.name, CodeInspectionGoal.name);
        assert.strictEqual(prodGoal.dependsOn.length, 2);
        assert.strictEqual(prodGoal.dependsOn[0].name, BuildGoal.name);
        assert.strictEqual(prodGoal.dependsOn[1].name, FingerprintGoal.name);
    });

    it("should not mutate pre conditions across goals instances", () => {
        const autofix = new Autofix();

        const goals1 = goals("goals #1")
            .plan(CodeInspectionGoal)
            .plan(autofix).after(CodeInspectionGoal);

        const goals2 = goals("goals #2")
            .plan(ArtifactGoal)
            .plan(autofix).after(ArtifactGoal);

        assert(autofix.dependsOn.length === 0);

        assert.strictEqual((goals1.goals[1] as GoalWithPrecondition).dependsOn[0], CodeInspectionGoal);
        assert.strictEqual((goals2.goals[1] as GoalWithPrecondition).dependsOn[0], ArtifactGoal);
    });

    it("should correctly register pre conditions for other goals instance", () => {
        const autofix = new Autofix();

        const goals1 = goals("goals #1")
            .plan(CodeInspectionGoal)
            .plan(ArtifactGoal).after(CodeInspectionGoal);

        const goals2 = goals("goals #2")
            .plan(autofix).after(goals1);

        assert(autofix.dependsOn.length === 0);

        assert.deepStrictEqual((goals2.goals[0] as GoalWithPrecondition).dependsOn.map(g => g.definition.uniqueName),
            [CodeInspectionGoal, ArtifactGoal].map(g => g.definition.uniqueName));
    });

    it("should correctly maintain changed goal defintion", () => {
        const g1 = goal({ });
        const g2 = goal({ });
        const gs = goals("test").plan(g1).plan(g2).after(g1);
        g2.definition.displayName = "some test";

        const gc2 = gs.goals.find(g => g.uniqueName === g2.uniqueName);
        assert.strictEqual(gc2.definition.displayName, g2.definition.displayName);
    });

});
