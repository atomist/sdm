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

import * as assert from "assert";
import { StringCapturingProgressLog } from "../../../lib/api-helper/log/StringCapturingProgressLog";
import {
    PipelineStep,
    runPipeline,
} from "../../../lib/core/goal/common/pipeline";
import { SdmGoalState } from "../../../lib/typings/types";

describe("pipeline", () => {

    describe("runPipeline", () => {

        it("should execute all steps in correct order", async () => {
            const order = [];
            const step1: PipelineStep = {
                name: "step1",
                run: async () => {
                    order.push("1");
                },
            };
            const step2: PipelineStep = {
                name: "step2",
                run: async () => {
                    order.push("2");
                },
            };
            const step3: PipelineStep = {
                name: "step3",
                run: async () => {
                    order.push("3");
                },
            };

            const result = await runPipeline({ progressLog: new StringCapturingProgressLog() } as any, step1, step2, step3);
            assert.deepStrictEqual(result, undefined);
            assert.deepStrictEqual(order, ["1", "2", "3"]);
        });

        it("should skip steps", async () => {
            const order = [];
            const step1: PipelineStep = {
                name: "step1",
                run: async () => {
                    order.push("1");
                },
            };
            const step2: PipelineStep = {
                name: "step2",
                run: async () => {
                    order.push("2");
                },
                runWhen: async () => false,
            };
            const step3: PipelineStep = {
                name: "step3",
                run: async () => {
                    order.push("3");
                },
            };

            const result = await runPipeline({ progressLog: new StringCapturingProgressLog() } as any, step1, step2, step3);
            assert.deepStrictEqual(result, undefined);
            assert.deepStrictEqual(order, ["1", "3"]);
        });

        it("should stop and return goal state", async () => {
            const order = [];
            const step1: PipelineStep = {
                name: "step1",
                run: async () => {
                    order.push("1");
                    return {
                        state: SdmGoalState.failure,
                        phase: "foo",
                    };
                },
            };
            const step2: PipelineStep = {
                name: "step2",
                run: async () => {
                    order.push("2");
                },
            };

            const result = await runPipeline({ progressLog: new StringCapturingProgressLog() } as any, step1, step2);
            assert.deepStrictEqual(result, { state: SdmGoalState.failure, phase: "foo" });
            assert.deepStrictEqual(order, ["1"]);
        });

        it("should fail on error", async () => {
            const order = [];
            const step1: PipelineStep = {
                name: "step1",
                run: async () => {
                    order.push("1");
                    throw new Error("Error occurred in step1");
                },
            };
            const step2: PipelineStep = {
                name: "step2",
                run: async () => {
                    order.push("2");
                },
            };

            const result = await runPipeline({ progressLog: new StringCapturingProgressLog() } as any, step1, step2);
            assert.deepStrictEqual(result, { state: SdmGoalState.failure, phase: "step1" });
            assert.deepStrictEqual(order, ["1"]);
        });

        it("should pass context between steps", async () => {
            const order = [];
            const step1: PipelineStep<{ foo: string }> = {
                name: "step1",
                run: async (gi, context) => {
                    order.push("1");
                    context.foo = "bar";
                },
            };
            const step2: PipelineStep = {
                name: "step2",
                run: async (gi, context) => {
                    order.push("2");
                    assert.deepStrictEqual(context, { foo: "bar" });
                },
            };

            await runPipeline({ progressLog: new StringCapturingProgressLog() } as any, step1, step2);
            assert.deepStrictEqual(order, ["1", "2"]);
        });
    });
});
