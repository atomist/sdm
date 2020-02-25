/*
 * Copyright © 2020 Atomist, Inc.
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

import { defaultHttpClientFactory } from "@atomist/automation-client/lib/spi/http/httpClient";
import * as assert from "power-assert";
import { ImmaterialGoals } from "../../../../lib/api/goal/common/Immaterial";
import { Locking } from "../../../../lib/api/goal/common/Locking";
import { goal } from "../../../../lib/api/goal/GoalWithFulfillment";
import { Container } from "../../../../lib/core/goal/container/container";
import { DockerContainerRegistration } from "../../../../lib/core/goal/container/docker";
import {
    GoalMaker,
    mapGoals,
} from "../../../../lib/core/machine/yaml/mapGoals";

describe("machine/yaml/mapGoals", () => {

    describe("mapGoals", () => {

        it("should error for unknown goal", async () => {
            const yaml = { use: "unknown-goal" };
            try {
                await mapGoals(undefined, yaml, {}, {}, {}, {});
                assert.fail();
            } catch (e) {
                assert.deepStrictEqual(e.message, "Unable to construct goal from '{\"use\":\"unknown-goal\"}'");
            }
        });

        it("should map immaterial goals", async () => {
            const yaml = { use: "immaterial" };
            const goals = await mapGoals(undefined, yaml, {}, {}, {}, {});
            assert.deepStrictEqual(goals, ImmaterialGoals.andLock().goals);
        });

        it("should map locking goal", async () => {
            const yaml = { use: "lock" };
            const goals = await mapGoals(undefined, yaml, {}, {}, {}, {});
            assert.deepStrictEqual(goals, Locking);
        });

        it("should map additional goal", async () => {
            const sampleGoal = goal({ displayName: "Sample Goal" });
            const yaml = { use: "sampleGoal" };
            const goals = await mapGoals(undefined, yaml, { sampleGoal }, {}, {}, {});
            assert.deepStrictEqual(goals, sampleGoal);
        });

        it("should map goalMaker goal", async () => {
            const sampleGoal = goal({ displayName: "Sample Goal" });
            const sampleGoalMaker: GoalMaker = async () => sampleGoal;
            const yaml = {
                use: "sampleGoal",
                input: { classifier: "version" },
                output: { classifier: "target", pattern: { directory: "target" } },

            };
            const goals = await mapGoals(undefined, yaml, {}, { sampleGoal: sampleGoalMaker }, {}, {});
            assert.deepStrictEqual(goals, sampleGoal);
        });

        it("should map goalMaker goal with parameters", async () => {
            const yaml = {
                use: "sampleGoal",
                parameters: {
                    foo: "bar",
                },
            };
            const sampleGoal = goal({ displayName: "Sample Goal" });
            const sampleGoalMaker: GoalMaker = async (sdm, params) => {
                assert.deepStrictEqual(params, yaml.parameters);
                return sampleGoal;
            };
            const goals = await mapGoals(undefined, yaml, {}, { sampleGoal: sampleGoalMaker }, {}, {});
            assert.deepStrictEqual(goals, sampleGoal);
        });

        it("should map container goal", async () => {
            const yaml: DockerContainerRegistration = {
                name: "mongo",
                containers: [{
                    name: "mongo",
                    image: "mongo:latest",
                    volumeMounts: [{
                        name: "cache",
                        mountPath: "/cache",
                    }],
                    secrets: [{
                        env: [{ name: "TEST", value: { encrypted: "sdfsdg34049tzewrghiokblsvbjskdv" } }],
                    }],
                }],
                volumes: [{
                    name: "cache",
                    hostPath: {
                        path: "/tmp/cache",
                    },
                }],
                input: [{ classifier: "dependencies" }],
                output: [{
                    classifier: "scripts",
                    pattern: {
                        globPattern: "*/*.js",
                    },
                }],
                approval: true,
                preApproval: true,
                retry: true,
                descriptions: {
                    completed: "What am awesome mongo goal",
                },
            } as any;
            const goals = await mapGoals(undefined, yaml, {}, {}, {}, {}) as Container;
            assert.deepStrictEqual(goals.definition.retryFeasible, true);
            assert.deepStrictEqual(goals.definition.approvalRequired, true);
            assert.deepStrictEqual(goals.definition.preApprovalRequired, true);
            assert.deepStrictEqual(goals.definition.completedDescription, (yaml as any).descriptions.completed);
            assert.deepStrictEqual(goals.registrations[0].volumes, yaml.volumes);
            assert.deepStrictEqual(goals.registrations[0].input, yaml.input);
            assert.deepStrictEqual(goals.registrations[0].output, yaml.output);
            assert.deepStrictEqual(goals.projectListeners.length, 2);
        });

        it("should map goals from array", async () => {
            const sampleGoal1 = goal({ displayName: "Sample Goal1" });
            const sampleGoal2 = goal({ displayName: "Sample Goal2" });
            const yaml = [{ use: "sampleGoal1" }, { use: "sampleGoal2" }];
            const goals = await mapGoals(undefined, yaml, { sampleGoal1, sampleGoal2 }, {}, {}, {});
            assert.deepStrictEqual(goals, [sampleGoal1, sampleGoal2]);
        });

        it("should map referenced goal with parameters", async () => {
            const yaml = [{
                ref: "atomist/npm-goal/publish@master",
                parameters: { command: "build" },
            }, { use: "atomist/npm-goal/install@master" }];
            const goals = await mapGoals({
                configuration: { http: { client: { factory: defaultHttpClientFactory() } } },
            } as any, yaml, {}, {}, {}, {});
            assert(!!goals);
        }).timeout(10000);

        it("should map referenced goal", async () => {
            const yaml = { ref: "atomist/npm-goal/i-dont-exist@0.0.1" };
            try {
                await mapGoals({ configuration: { http: { client: { factory: defaultHttpClientFactory() } } } } as any, yaml, {}, {}, {}, {});
                assert.fail();
            } catch (e) {
                assert.deepStrictEqual(e.message, "Unable to construct goal from '{\"ref\":\"atomist/npm-goal/i-dont-exist@0.0.1\"}'");
            }
        }).timeout(10000);

        it("should map skill with parameters", async () => {
            const yaml = [{ use: "atomist/npm-goal/publish", parameters: { command: "build" } }];
            const goals = await mapGoals({} as any, yaml, {}, {}, {}, {});
            assert(!!goals);
        }).timeout(10000);

    });

});
