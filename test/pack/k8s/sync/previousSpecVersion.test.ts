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

import * as cp from "@atomist/automation-client/lib/util/child_process";
import * as assert from "power-assert";
import * as prv from "../../../../lib/pack/k8s/sync/previousSpecVersion";

describe("pack/k8s/previousSpecVersion", () => {

    let originalExecPromise: any;
    before(() => {
        originalExecPromise = Object.getOwnPropertyDescriptor(cp, "execPromise");
    });

    after(() => {
        Object.defineProperty(cp, "execPromise", originalExecPromise);
    });

    it("git show throws on delete", async () => {
        Object.defineProperty(cp, "execPromise", {
            value: async () => {
                throw new Error("git show failure");
            },
        });
        const fileContents = await prv.previousSpecVersion("", "", "");
        assert.equal(fileContents, "");
    });

    it("git show returns the file contents", async () => {
        Object.defineProperty(cp, "execPromise", {
            value: async () => {
                return {
                    stdout: "<file contents>",
                };
            },
        });
        const fileContents = await prv.previousSpecVersion("", "", "");
        assert.equal(fileContents, "<file contents>");
    });
});
