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
import { goalSetState } from "../../../lib/api-helper/goal/storeGoals";
import { SdmGoalState } from "../../../lib/typings/types";

describe("storeGoals", () => {

    describe("goalSetState", () => {

        function createGoals(...states: string[]): Array<{ state: SdmGoalState }> {
            return states.map(s => ({ state: s as SdmGoalState }));
        }

        it("should correctly determine success", () => {
            assert.strictEqual(goalSetState(createGoals("success", "success", "success")), SdmGoalState.success);
        });

        it("should correctly determine in_process", () => {
            assert.strictEqual(goalSetState(createGoals("success", "in_process", "success")), SdmGoalState.in_process);
            assert.strictEqual(goalSetState(createGoals("planned", "in_process", "success")), SdmGoalState.in_process);
            assert.strictEqual(goalSetState(createGoals("requested", "in_process", "success")), SdmGoalState.in_process);
        });

        it("should correctly determine failure", () => {
            assert.strictEqual(goalSetState(createGoals("success", "in_process", "failure")), SdmGoalState.failure);
            assert.strictEqual(goalSetState(createGoals("canceled", "in_process", "failure")), SdmGoalState.failure);
            assert.strictEqual(goalSetState(createGoals("stopped", "in_process", "failure")), SdmGoalState.failure);
            assert.strictEqual(goalSetState(createGoals("waiting_for_approval", "in_process", "failure")), SdmGoalState.failure);
            assert.strictEqual(goalSetState(createGoals("waiting_for_pre_approval", "stopped", "failure")), SdmGoalState.failure);
        });

        it("should correctly determine in_process", () => {
            assert.strictEqual(goalSetState(createGoals("requested", "in_process", "planned")), SdmGoalState.in_process);
            assert.strictEqual(goalSetState(createGoals("requested", "in_process", "planned")), SdmGoalState.in_process);
            assert.strictEqual(goalSetState(createGoals("waiting_for_approval", "in_process", "success")), SdmGoalState.in_process);
        });

        it("should correctly determine waiting_for_approval", () => {
            assert.strictEqual(goalSetState(createGoals("requested", "waiting_for_approval", "success")), SdmGoalState.waiting_for_approval);
        });

        it("should correctly determine waiting_for_pre_approval", () => {
            assert.strictEqual(goalSetState(createGoals("waiting_for_pre_approval", "waiting_for_approval", "success")),
                SdmGoalState.waiting_for_pre_approval);
        });
    });

});
