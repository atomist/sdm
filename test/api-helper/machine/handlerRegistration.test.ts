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

import * as assert from "power-assert";
import { resolveCredentialsPromise } from "../../../lib/api-helper/machine/handlerRegistrations";

describe("handlerRegistration", () => {

    describe("resolveCredentialsPromise", () => {

        it("should resolve undefined", async () => {
            const pr = await resolveCredentialsPromise(undefined);
            assert(pr === undefined);
        });

        it("should resolve promise credentials", async () => {
            const creds = { token: "123456" };
            const pr = await resolveCredentialsPromise(Promise.resolve(creds));
            assert.strictEqual(pr, creds);
        });

        it("should resolve resolve credentials value", async () => {
            const creds = { token: "123456" };
            const pr = await resolveCredentialsPromise(creds);
            assert.strictEqual(pr, creds);
        });

    });

});
