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

import * as assert from "power-assert";
import {
    goal,
    mergeOptions,
} from "../../../lib/api/goal/GoalWithFulfillment";
import { IndependentOfEnvironment } from "../../../lib/api/goal/support/environment";

describe("GoalWithFulfillment", () => {

    describe("goal", () => {

        it("should create an empty goal", () => {
            const g = goal();
            assert(g.uniqueName.startsWith("goal#GoalWithFulfillment.test."));
            assert.strictEqual(g.uniqueName, g.name);
            assert.strictEqual(g.environment, IndependentOfEnvironment);
        });

    });

    describe("mergeOptions", () => {

        it("should merge defaults with explicit values", () => {
            const opts = mergeOptions({ foo: { bar: 1 } }, { foo: { bar: 2, bla: 3 } });
            assert.deepStrictEqual(opts, { foo: { bar: 2, bla: 3 } });
        });

        it("should merge defaults with explicit values with partial overwrite", () => {
            const opts = mergeOptions({ foo: { bar: 1 } }, { foo: { bla: 3 } });
            assert.deepStrictEqual(opts, { foo: { bar: 1, bla: 3 } });
        });

    });

});
