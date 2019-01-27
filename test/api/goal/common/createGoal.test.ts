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

import { Success } from "@atomist/automation-client";
import * as assert from "power-assert";
import { createPredicatedGoalExecutor } from "../../../../lib/api/goal/common/createGoal";
import { suggestAction } from "../../../../lib/api/goal/common/suggestAction";
import { GoalInvocation } from "../../../../lib/api/goal/GoalInvocation";

describe("createGoal", () => {

    describe("createGoal", () => {

        it("should return", () => {
            suggestAction({ displayName: "foo", message: "foo bar" });
        });

    });

    describe("createPredicatedGoalExecutor", () => {

        it("should correctly retry", async () => {
            let count = 0;
            const ge = createPredicatedGoalExecutor(
                "test",
                async () => {
                    return Success;
                },
                {
                    condition: async gi => {
                        count++;
                        return count === 9;
                    },
                    retries: 10,
                    timeoutMillis: 100,
                }, false);
            const r = await ge({} as any);
            assert.equal(count, 9);
        });

        it("should pass when condition is true", async () => {
            let executed = false;
            const ge = createPredicatedGoalExecutor(
                "test",
                async () => {
                    executed = true;
                },
                {
                    condition: async gi => {
                        return true;
                    },
                    retries: 3,
                    timeoutMillis: 100,
                }, false);
            await ge({} as any);
            assert.strictEqual(executed, true);
        });

        it("should fail when condition is never true", async () => {
            let executed = false;
            const ge = createPredicatedGoalExecutor(
                "test",
                async () => {
                    executed = true;
                },
                {
                    condition: async gi => {
                        return false;
                    },
                    retries: 3,
                    timeoutMillis: 100,
                }, false);
            try {
                await ge({} as any);
            } catch (e) {
                assert(e.message.includes("Goal 'test' timed out after max retries"));
            }
        });

    });

});
