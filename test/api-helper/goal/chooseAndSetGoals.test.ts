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
import { planGoals } from "../../../lib/api-helper/goal/chooseAndSetGoals";
import {
    Goal,
    GoalWithPrecondition,
} from "../../../lib/api/goal/Goal";
import { Goals } from "../../../lib/api/goal/Goals";
import { GoalWithFulfillment } from "../../../lib/api/goal/GoalWithFulfillment";

describe("chooseAndSetGoals", () => {

    describe("planGoals", () => {

        it("should plan two instances which run sequentially", async () => {
            const preGoal = new Goal({ uniqueName: "test0" });
            const goal = new GoalWithFulfillment({
                uniqueName: "test1",
                displayName: "Test1",
                plannedDescription: "This goal is not so great!",
            }, preGoal);
            const postGoal = new GoalWithPrecondition({ uniqueName: "test2" }, goal);

            goal.plan = async () => {
                const a = {
                    details: {
                        displayName: "Test1a",
                        descriptions: {
                            planned: "This goal is awesome",
                        },
                    },
                    parameters: {
                        foo: "bar",
                    },
                };
                const b = {
                    details: {
                        displayName: "Test2a",
                    },
                    parameters: {
                        bar: "foo",
                    },
                };

                return {
                    test: { goals: [a, b] },
                };
            };

            const goals = (await planGoals(new Goals("test", preGoal, goal, postGoal), {} as any)).goals;

            assert.strictEqual(goals.length, 4);
            assert.deepStrictEqual(goals[0], preGoal);
            assert.strictEqual(goals[1].name, "Test1a");
            assert.strictEqual(goals[1].uniqueName, "test1#sdm:0");
            assert.strictEqual(goals[1].plannedDescription, "This goal is awesome");
            assert.deepStrictEqual((goals[1].definition as any).parameters, { foo: "bar" });
            assert.strictEqual(goals[2].name, "Test2a");
            assert.strictEqual(goals[2].uniqueName, "test1#sdm:1");
            assert.strictEqual(goals[2].plannedDescription, "This goal is not so great!");
            assert.deepStrictEqual((goals[2] as any).dependsOn, [goals[0], goals[1]]);
            assert.deepStrictEqual((goals[2].definition as any).parameters, { bar: "foo" });
            assert.deepStrictEqual(goals[3], postGoal);
            assert.deepStrictEqual((goals[3] as any).dependsOn, [goals[1], goals[2]]);
        });

        it("should plan three instances which run in parallel and sequential", async () => {
            const preGoal = new Goal({ uniqueName: "test0" });
            const goal = new GoalWithFulfillment({ uniqueName: "test1", displayName: "Test1" }, preGoal);
            const postGoal = new GoalWithPrecondition({ uniqueName: "test2" }, goal);

            goal.plan = async () => {
                return {
                    test: {
                        goals: [[{
                            details: {
                                displayName: "Test1a",
                            },
                            parameters: {
                                foo: "bar",
                            },
                        }, {
                            details: {
                                displayName: "Test2a",
                            },
                            parameters: {
                                bar: "foo",
                            },
                        }], {
                            details: {
                                displayName: "Test3a",
                            },
                            parameters: {
                                bar: "foo",
                            },
                        }],
                    },
                };
            };

            const goals = (await planGoals(new Goals("test", preGoal, goal, postGoal), {} as any)).goals;

            assert.strictEqual(goals.length, 5);
            assert.deepStrictEqual(goals[0], preGoal);
            assert.strictEqual(goals[1].name, "Test1a");
            assert.strictEqual(goals[1].uniqueName, "test1#sdm:0");
            assert.deepStrictEqual((goals[1].definition as any).parameters, { foo: "bar" });
            assert.deepStrictEqual((goals[1] as any).dependsOn, [goals[0]]);
            assert.strictEqual(goals[2].name, "Test2a");
            assert.strictEqual(goals[2].uniqueName, "test1#sdm:1");
            assert.deepStrictEqual((goals[2].definition as any).parameters, { bar: "foo" });
            assert.deepStrictEqual((goals[2] as any).dependsOn, [goals[0]]);
            assert.strictEqual(goals[3].name, "Test3a");
            assert.strictEqual(goals[3].uniqueName, "test1#sdm:2");
            assert.deepStrictEqual((goals[3].definition as any).parameters, { bar: "foo" });
            assert.deepStrictEqual((goals[3] as any).dependsOn, [goals[0], goals[1], goals[2]]);
            assert.deepStrictEqual(goals[4], postGoal);
            assert.deepStrictEqual((goals[4] as any).dependsOn, [goals[1], goals[2], goals[3]]);
        });

        it("should plan two different sets with dependsOn", async () => {
            const preGoal = new Goal({ uniqueName: "test0" });
            const goal = new GoalWithFulfillment({ uniqueName: "test1", displayName: "Test1" }, preGoal);
            const postGoal = new GoalWithPrecondition({ uniqueName: "test2" }, goal);

            goal.plan = async () => {
                return {
                    build: {
                        goals: {
                            details: {
                                displayName: "Test1a",
                            },
                            parameters: {
                                foo: "bar",
                            },
                        },
                    },
                    docker_build: {
                        goals: {
                            details: {
                                displayName: "Test2a",
                            },
                            parameters: {
                                bar: "foo",
                            },
                        },
                        dependsOn: "build",
                    },
                };
            };

            const goals = (await planGoals(new Goals("test", preGoal, goal, postGoal), {} as any)).goals;

            assert.strictEqual(goals.length, 4);
            assert.deepStrictEqual(goals[0], preGoal);
            assert.strictEqual(goals[1].name, "Test1a");
            assert.strictEqual(goals[1].uniqueName, "test1#sdm:0");
            assert.deepStrictEqual((goals[1].definition as any).parameters, { foo: "bar" });
            assert.deepStrictEqual((goals[1] as any).dependsOn, [goals[0]]);
            assert.strictEqual(goals[2].name, "Test2a");
            assert.strictEqual(goals[2].uniqueName, "test1#sdm:1");
            assert.deepStrictEqual((goals[2].definition as any).parameters, { bar: "foo" });
            assert.deepStrictEqual((goals[2] as any).dependsOn, [goals[0], goals[1]]);
            assert.deepStrictEqual(goals[3], postGoal);
            assert.deepStrictEqual((goals[3] as any).dependsOn, [goals[1], goals[2]]);
        });

        it("should plan a single goal with parameters", async () => {
            const goal = new GoalWithFulfillment({
                uniqueName: "test1",
                displayName: "Test1",
                plannedDescription: "This goal is not so great!",
            });

            goal.plan = async () => {
                return {
                    parameters: { foo: "bar" },
                };
            };

            const goals = (await planGoals(new Goals("test", goal), {} as any)).goals;

            assert.strictEqual(goals.length, 1);
            assert.deepStrictEqual(goals[0].name, goal.name);
            assert.deepStrictEqual((goals[0].definition as any).parameters, { foo: "bar"});
        });

        it("should plan goals with dependencies", async () => {
            const goal1 = new GoalWithFulfillment({
                uniqueName: "test1",
                displayName: "Test1",
            });
            const goal2 = new GoalWithFulfillment({
                uniqueName: "test2",
                displayName: "Test2",
            }, goal1);
            const goal3 = new GoalWithFulfillment({
                uniqueName: "test3",
                displayName: "Test3",
            }, goal1, goal2);

            goal1.plan = async () => {
                return {
                    parameters: { foo: "bar" },
                };
            };
            goal2.plan = async () => {
                return {
                    parameters: { foo: "bar" },
                };
            };
            goal3.plan = async () => {
                return {
                    parameters: { foo: "bar" },
                };
            };

            const goals = (await planGoals(new Goals("test", goal1, goal2, goal3), {} as any)).goals;

            assert.strictEqual(goals.length, 3);
            assert.deepStrictEqual((goals[1] as any).dependsOn[0].definition.uniqueName, "test1#sdm:0");
            assert.deepStrictEqual((goals[2] as any).dependsOn[0].definition.uniqueName, "test1#sdm:0");
            assert.deepStrictEqual((goals[2] as any).dependsOn[1].definition.uniqueName, "test2#sdm:0");
        });
    });
});
