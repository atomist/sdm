/*
 * Copyright © 2019 Atomist, Inc.
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
import { goal } from "../../../lib/api/goal/GoalWithFulfillment";
import { hasFile } from "../../../lib/api/mapping/support/commonPushTests";
import {
    convertGoalData,
    GoalData,
} from "../../../lib/core/machine/configure";

describe("configure", () => {

    const g1 = goal({ uniqueName: "goal1" });
    const g2 = goal({ uniqueName: "goal2" });
    const g3 = goal({ uniqueName: "goal3" });

    describe("convertGoalData", () => {

        it("should convert single goal", () => {
            const gd: GoalData = {
                test_underscore: {
                    test: [hasFile("bla.json"), hasFile("foo.bar")],
                    goals: g1,
                },
            };

            const gcs = convertGoalData(gd);
            assert(!!gcs);
            assert.strictEqual(gcs.length, 1);
            const gc: any = gcs[0];
            assert.strictEqual(gc.goalsName, "test underscore");
            const g = gc.staticValue.goals;
            assert.strictEqual(g.length, 1);
            assert.strictEqual(g[0], g1);
        });

        it("should convert two goals", () => {
            const gd: GoalData = {
                test: {
                    goals: [g1, g2],
                },
            };

            const gcs = convertGoalData(gd);
            assert(!!gcs);
            assert.strictEqual(gcs.length, 1);
            const gc: any = gcs[0];
            assert.strictEqual(gc.goalsName, "test");
            const g = gc.staticValue.goals;
            assert.strictEqual(g.length, 2);
            assert.strictEqual(g[0], g1);
            assert.strictEqual(g[0].dependsOn.length, 0);
            assert.strictEqual(g[1].uniqueName, g2.uniqueName);
            assert.strictEqual(g[1].dependsOn[0], g1);
        });

        it("should convert two concurrent goals", () => {
            const gd: GoalData = {
                test: {
                    goals: [[g1, g2]],
                },
            };

            const gcs = convertGoalData(gd);
            assert(!!gcs);
            assert.strictEqual(gcs.length, 1);
            const gc: any = gcs[0];
            assert.strictEqual(gc.goalsName, "test");
            const g = gc.staticValue.goals;
            assert.strictEqual(g.length, 2);
            assert.strictEqual(g[0], g1);
            assert.strictEqual(g[0].dependsOn.length, 0);
            assert.strictEqual(g[1], g2);
            assert.strictEqual(g[1].dependsOn.length, 0);
        });

        it("should convert three goals", () => {
            const gd: GoalData = {
                test: {
                    goals: [
                        [g1, g2],
                        g3,
                    ],
                },
            };

            const gcs = convertGoalData(gd);
            assert(!!gcs);
            assert.strictEqual(gcs.length, 1);
            const gc: any = gcs[0];
            assert.strictEqual(gc.goalsName, "test");
            const g = gc.staticValue.goals;
            assert.strictEqual(g.length, 3);
            assert.strictEqual(g[0], g1);
            assert.strictEqual(g[0].dependsOn.length, 0);
            assert.strictEqual(g[1], g2);
            assert.strictEqual(g[1].dependsOn.length, 0);
            assert.strictEqual(g[2].uniqueName, g3.uniqueName);
            assert.strictEqual(g[2].dependsOn.length, 2);
            assert.strictEqual(g[2].dependsOn[0], g1);
            assert.strictEqual(g[2].dependsOn[1], g2);
        });

        it("should convert single goals in two sets", () => {
            const gd: GoalData = {
                test1: {
                    goals: g1,
                },
                test2: {
                    goals: g2,
                },
            };

            const gcs = convertGoalData(gd);
            assert(!!gcs);
            assert.strictEqual(gcs.length, 2);
            const gc1: any = gcs[0];
            const gs1 = gc1.staticValue.goals;
            assert.strictEqual(gs1.length, 1);
            assert.strictEqual(gs1[0], g1);

            const gc2: any = gcs[1];
            const gs2 = gc2.staticValue.goals;
            assert.strictEqual(gs2.length, 1);
            assert.strictEqual(gs2[0], g2);
        });

        it("should convert single goals in two sets with a set dependency", () => {
            const gd: GoalData = {
                test1: {
                    goals: g1,
                },
                test2: {
                    dependsOn: "test1",
                    goals: g2,
                },
            };

            const gcs = convertGoalData(gd);
            assert(!!gcs);
            assert.strictEqual(gcs.length, 2);
            const gc1: any = gcs[0];
            const gs1 = gc1.staticValue.goals;
            assert.strictEqual(gs1.length, 1);
            assert.strictEqual(gs1[0], g1);

            const gc2: any = gcs[1];
            const gs2 = gc2.staticValue.goals;
            assert.strictEqual(gs2.length, 1);
            assert.strictEqual(gs2[0].uniqueName, g2.uniqueName);
            assert.strictEqual(gs2[0].dependsOn.length, 1);
            assert.strictEqual(gs2[0].dependsOn[0], g1);
        });

        it("should convert single goals in two sets with a goal dependency", () => {
            const gd: GoalData = {
                test1: {
                    goals: g1,
                },
                test2: {
                    dependsOn: g1,
                    goals: g2,
                },
            };

            const gcs = convertGoalData(gd);
            assert(!!gcs);
            assert.strictEqual(gcs.length, 2);
            const gc1: any = gcs[0];
            const gs1 = gc1.staticValue.goals;
            assert.strictEqual(gs1.length, 1);
            assert.strictEqual(gs1[0], g1);

            const gc2: any = gcs[1];
            const gs2 = gc2.staticValue.goals;
            assert.strictEqual(gs2.length, 1);
            assert.strictEqual(gs2[0].uniqueName, g2.uniqueName);
            assert.strictEqual(gs2[0].dependsOn.length, 1);
            assert.strictEqual(gs2[0].dependsOn[0], g1);
        });

        it("should raise error when set dependency does not exist", () => {
            const gd: GoalData = {
                test1: {
                    goals: g1,
                },
                test2: {
                    dependsOn: "test3",
                    goals: g2,
                },
            };

            try {
                convertGoalData(gd);
                assert.fail();
            } catch (e) {
                assert.strictEqual(
                    e.message,
                    "Provided dependsOn goals with name 'test3' do not exist or is after current goals named 'test2'");
            }
        });

        it("should raise error when set dependency is in wrong order", () => {
            const gd: GoalData = {
                test2: {
                    dependsOn: "test1",
                    goals: g2,
                },
                test1: {
                    goals: g1,
                },
            };

            try {
                convertGoalData(gd);
                assert.fail();
            } catch (e) {
                assert.strictEqual(
                    e.message,
                    "Provided dependsOn goals with name 'test1' do not exist or is after current goals named 'test2'");
            }
        });

    });
});
