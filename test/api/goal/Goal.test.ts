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
import { Goal } from "../../../lib/api/goal/Goal";
import { DefaultGoalNameGenerator } from "../../../lib/api/goal/GoalNameGenerator";

describe("Goal", () => {

    describe("validateGoalDefinition", () => {

        it("should accept valid uniqueName", () => {
            const g1 = new Goal({ uniqueName: "test-123" });
            assert.strictEqual(g1.uniqueName, "test-123");
            assert.strictEqual(g1.definition.uniqueName, "test-123");

            const name = DefaultGoalNameGenerator.generateName("test");
            const g2 = new Goal({ uniqueName: name });
            assert.strictEqual(g2.uniqueName, name);
            assert.strictEqual(g2.definition.uniqueName, name);
        });

        it("should correctly replace unwanted characters", () => {
            const g1 = new Goal({ uniqueName: "test_123" });
            assert.strictEqual(g1.uniqueName, "test-123");
            assert.strictEqual(g1.definition.uniqueName, "test-123");

            const g2 = new Goal({ uniqueName: "test 123" });
            assert.strictEqual(g2.uniqueName, "test-123");
            assert.strictEqual(g2.definition.uniqueName, "test-123");
        });

        it("should correctly throw error when uniqueName is incorrectly formatted", () => {
            assert.throws(() => new Goal({ uniqueName: "test.123" }), /Error: Goal uniqueName 'test\.123'/);
        });

    });

});
