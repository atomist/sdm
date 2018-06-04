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
import { allOf } from "../../../src/api/dsl/allOf";
import { PushListenerInvocation } from "../../../src/api/listener/PushListener";
import { fakePush } from "./decisionTreeTest";

describe("allOf", () => {

    it("should satisfy function => true", async () => {
        const test = allOf(() => true);
        assert.equal(await test.mapping(fakePush()), true);
    });

    it("should satisfy function => Promise(true)", async () => {
        const test = allOf(async () => true);
        assert.equal(await test.mapping(fakePush()), true);
    });

    it("should not satisfy function => Promise(true) and false", async () => {
        const test = allOf(async () => true, () => false);
        assert.equal(await test.mapping(fakePush()), false);
    });

    it("should satisfy function => Promise(true) and correct calculation", async () => {
        const test = allOf<PushListenerInvocation>(async () => true, async pu => pu.push.id.includes("_"));
        assert.equal(await test.mapping(fakePush()), true);
    });

});
