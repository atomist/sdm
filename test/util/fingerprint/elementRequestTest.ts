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

import { InMemoryProject } from "@atomist/automation-client/project/mem/InMemoryProject";
import { findElements } from "../../../src/util/fingerprint/elementRequest";

import * as assert from "power-assert";

describe("elementRequest", () => {

    it("supports JavaScript", () => {

        it("finds functions", async () => {
            const p = InMemoryProject.of({
                path: "script.js",
                content:
                    "function it(a, b) { // get rid of this \nreturn \n 'frogs'; }",
            });
            const functions = await findElements(p);
            assert.equal(functions.length, 1);
            assert.equal(functions[0].identifier, "it");
            assert.equal(functions[0].canonicalBody,
                "function it(a, b){return 'frogs';}");
            assert.equal(functions[0].path,
                "script.js");
        });

        it("finds matching functions", async () => {
            const p = InMemoryProject.of({
                path: "script.js",
                content:
                    "function it(a, b) { // get rid of this \nreturn \n 'frogs'; } function notIt() {}",
            });
            const functions = await findElements(p, {
                identifierPattern: /^i.*$/,
            });
            assert.equal(functions.length, 1);
            assert.equal(functions[0].identifier, "it");
            assert.equal(functions[0].canonicalBody,
                "function it(a, b){return 'frogs';}");
            assert.equal(functions[0].path,
                "script.js");
            assert(!!functions[0].sha);
        });

    });

});
