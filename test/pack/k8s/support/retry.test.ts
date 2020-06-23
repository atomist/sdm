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
import { logRetry } from "../../../../lib/pack/k8s/support/retry";

describe("pack/k8s/support/retry", () => {

    describe("logRetry", () => {

        it("should wrap a non-Error in an Error", async () => {
            // tslint:disable-next-line:no-string-throw
            const f = () => { throw "error string"; };
            const d = "retry test";
            const o = {
                retries: 2,
                factor: 1,
                minTimeout: 5,
                maxTimeout: 5,
                randomize: false,
            };
            let thrown = false;
            try {
                await logRetry(f, d, o);
            } catch (e) {
                thrown = true;
                assert(e instanceof Error);
                assert(e.message === "error string");
            }
            assert(thrown, "error not thrown");
        });

    });

});
