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
import { serializeResult } from "../../../lib/api-helper/misc/result";

describe("result", () => {

    it("should strip childProcess from string", () => {
        const result = {
            childProcess: {
                foo: "bar",
            },
            message: "test",
            error: "error",
            code: 100,
        };
        const safeResult = JSON.parse(serializeResult(result));
        delete result.childProcess;
        assert.deepEqual(safeResult, result);
    });

    it("should strip nested childProcess from string", () => {
        const result: any = {
            childProcess: {
                foo: "bar",
            },
            message: "test",
            error: "error",
            code: 100,
            foo: {
                bar: {
                    childProcess: "bla",
                },
            },
        } as any;
        const safeResult = JSON.parse(serializeResult(result));
        delete result.childProcess;
        delete result.foo.bar.childProcess;
        assert.deepEqual(safeResult, result);
    });
});
