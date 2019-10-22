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

import * as assert from "assert";
import { fail } from "power-assert";
import {
    handleSdmGoalSetEvent,
    Queue,
} from "../../../../lib/api/goal/common/Queue";
import { Goal } from "../../../../lib/api/goal/Goal";
import { ExecuteGoal } from "../../../../lib/api/goal/GoalInvocation";
import { IndependentOfEnvironment } from "../../../../lib/api/goal/support/environment";
import {
    OnAnySdmGoalSet,
    SdmGoalState,
} from "../../../../lib/typings/types";

describe("Queue", () => {

    describe("Queue", () => {

        it("should set up correct goal definition", async () => {
            const q = new Queue({ uniqueName: "queue-test" });
            assert.strictEqual(q.definition.uniqueName, "queue-test");
            assert.strictEqual(q.definition.environment, IndependentOfEnvironment);
        });

        it("should set register event handler", async () => {
            const q = new Queue();
            const sdm = {
                addEvent: e => {
                    assert.strictEqual(e.name, "OnAnySdmGoalSet");
                    assert(e.subscription.includes("test-sdm"));
                },
                addGoalImplementation: async (implementationName: string, goal: Goal, goalExecutor: ExecuteGoal) => {
                    const c: any = {
                        configuration: {
                            name: "test",
                        },
                        context: {
                            graphClient: {
                                query: async () => { },
                            },
                        },
                        goalEvent: {
                            goalSetId: "x",
                        },
                        progressLog: {
                            write: () => { },
                        },
                    };
                    const r = await goalExecutor(c);
                    assert.strictEqual((r as any).state, SdmGoalState.in_process);
                },
                configuration: {
                    name: "test-sdm",
                },
            };
            q.register(sdm as any);
        });

    });

    describe("handleSdmGoalSetEvent", () => {

        it("should trigger no goal sets on no pending", async () => {
            const graphClient = {
                query: o => {
                    assert.deepStrictEqual(o.variables.registration, ["test-sdm"]);
                    return {
                        SdmGoalSet: [],
                    };
                },
            };
            const messageClient = {
                send: () => {
                    fail();
                },
            };
            const e: OnAnySdmGoalSet.Subscription = {
                SdmGoalSet: [{
                    goalSetId: "123456",
                }],
            };
            const h = handleSdmGoalSetEvent({}, { uniqueName: "test" }, { name: "test-sdm" } as any);
            const r = await h({ data: e } as any, { graphClient, messageClient } as any, {});
            assert.strictEqual(r.code, 0);
        });

        it("should trigger correct goal sets pending", async () => {
            const graphClient = {
                query: o => {
                    if (o.name === "InProcessSdmGoalSets") {
                        assert.deepStrictEqual(o.variables.registration, ["test-sdm"]);
                        return {
                            SdmGoalSet: [{
                                goalSetId: "1",
                                state: SdmGoalState.in_process,
                                goals: [{ name: "some-goal", uniqueName: "some-goal " }],
                            }, {
                                goalSetId: "2",
                                state: SdmGoalState.requested,
                                goals: [{ name: "test", uniqueName: "test" }],
                            }, {
                                goalSetId: "3",
                                state: SdmGoalState.requested,
                                goals: [{ name: "test", uniqueName: "test" }],
                            }, {
                                goalSetId: "4",
                                state: SdmGoalState.requested,
                                goals: [{ name: "test", uniqueName: "test" }],
                            }],
                        };
                    } else if (o.name === "SdmGoalsByGoalSetIdAndUniqueName") {
                        if (o.variables.goalSetId[0] === "2") {
                            return {
                                SdmGoal: [{
                                    uniqueName: "test",
                                    goalSetId: "2",
                                    state: SdmGoalState.in_process,
                                    ts: Date.now(),
                                    repo: {
                                        name: "sha",
                                        owner: "atomist",
                                        providerId: "123456",
                                    },
                                    push: {
                                        repo: {
                                            owner: "atomist",
                                            name: "sdm",
                                            org: {
                                                provider: {
                                                    providerId: "123456",
                                                },
                                            },
                                        },
                                    },
                                }],
                            };
                        } else {
                            return {
                                SdmGoal: [{
                                    uniqueName: "test",
                                    goalSetId: "3",
                                    state: SdmGoalState.in_process,
                                    ts: Date.now(),
                                    repo: {
                                        name: "sha",
                                        owner: "atomist",
                                        providerId: "123456",
                                    },
                                    push: {
                                        repo: {
                                            owner: "atomist",
                                            name: "sdm",
                                            org: {
                                                provider: {
                                                    providerId: "123456",
                                                },
                                            },
                                        },
                                    },
                                }, {
                                    uniqueName: "test",
                                    goalSetId: "4",
                                    state: SdmGoalState.in_process,
                                    ts: Date.now(),
                                    repo: {
                                        name: "sha",
                                        owner: "atomist",
                                        providerId: "123456",
                                    },
                                    push: {
                                        repo: {
                                            owner: "atomist",
                                            name: "sdm",
                                            org: {
                                                provider: {
                                                    providerId: "123456",
                                                },
                                            },
                                        },
                                    },
                                }],
                            };
                        }
                    }
                    return undefined;
                },
            };
            let start = 0;
            // let update = 0;
            const messageClient = {
                send: msg => {
                    if (!msg.phase) {
                        assert.strictEqual(msg.goalSetId, "2");
                        assert.strictEqual(msg.uniqueName, "test");
                        start++;
                    } else {
                        assert(msg.phase.includes("at"));
                        // update++;
                    }
                },
            };
            const e: OnAnySdmGoalSet.Subscription = {
                SdmGoalSet: [{
                    goalSetId: "4",
                }],
            };
            const h = handleSdmGoalSetEvent({}, { uniqueName: "test" }, { name: "test-sdm" } as any);
            const r = await h({ data: e } as any, {
                graphClient,
                messageClient,
                context: { name: "test-sdm", version: "1" },
            } as any, {});
            assert.strictEqual(start, 1);
            // assert.strictEqual(update, 2);
            assert.strictEqual(r.code, 0);
        });

    });

});
