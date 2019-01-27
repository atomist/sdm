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
import {
    isFailure,
    isSuccess,
} from "../../../lib/api/goal/ExecuteGoalResult";

describe("ExecuteGoalResult", () => {

    describe("isSuccess/isFailure", () => {

        it("should correctly detect success from undefined", () => {
            assert.strictEqual(isSuccess(undefined), true);
            assert.strictEqual(isFailure(undefined), false);
        });

        it("should correctly detect success from result without code", () => {
            assert.strictEqual(isSuccess({ message: "This is a test " }), true);
            assert.strictEqual(isFailure({ message: "This is a test " }), false);
        });

        it("should correctly detect success from result with code", () => {
            assert.strictEqual(isSuccess({ code: 0, message: "This is a test " }), true);
            assert.strictEqual(isFailure({ code: 0, message: "This is a test " }), false);
        });

        it("should correctly detect success from result with null code", () => {
            // tslint:disable-next-line:no-null-keyword
            assert.strictEqual(isSuccess({ code: null, message: "This is a test " }), true);
            // tslint:disable-next-line:no-null-keyword
            assert.strictEqual(isFailure({ code: null, message: "This is a test " }), false);
        });

        it("should correctly detect success from result with undefined code", () => {
            assert.strictEqual(isSuccess({ code: undefined, message: "This is a test " }), true);
            assert.strictEqual(isFailure({ code: undefined, message: "This is a test " }), false);
        });

        it("should correctly detect failure from result with code", () => {
            assert.strictEqual(isSuccess({ code: 1, message: "This is a test " }), false);
            assert.strictEqual(isFailure({ code: 1, message: "This is a test " }), true);
        });

    });

});
