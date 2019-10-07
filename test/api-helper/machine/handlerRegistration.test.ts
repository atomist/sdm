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
import { gitBranchCompatible, resolveCredentialsPromise } from "../../../lib/api-helper/machine/handlerRegistrations";

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

    describe("gitBranchCompatible", () => {

            it("remove spaces from branch name", async () => {
                const branchName = gitBranchCompatible("name with spaces");
                assert.strictEqual(branchName, "name_with_spaces");
            });

            it("slashes but cannot begin with a dot or end with .lock", async () => {
                const branchName = gitBranchCompatible(".name/with/slashes.lock");
                assert.strictEqual(branchName, "name/with/slashes");
            });

            it("branch names cannot have consecutive dots or end with a dot", async () => {
                const branchName = gitBranchCompatible("name/with..dots.");
                assert.strictEqual(branchName, "name/with_dots");
            });

            it("branch names cannot have ascii control characters", async () => {
                // const branchName = gitBranchCompatible("name\x00With\x07Control\x7fSequences");
                const branchName = gitBranchCompatible("name\x7Fwithctrlsequences\x00");
                assert.strictEqual(branchName, "namewithctrlsequences");
            });

            it("branch names cannot have ~ ^ :", async () => {
                const branchName = gitBranchCompatible("name:with^control~sequences");
                assert.strictEqual(branchName, "name_with_control_sequences");
            });

            it("branch names cannot have ? or * or [", async () => {
                const branchName = gitBranchCompatible("some*banned[characters?");
                assert.strictEqual(branchName, "some_banned_characters_");
            });

            it("branch names cannot begin or end with slashes or have consecutive slashes", async () => {
                const branchName = gitBranchCompatible("/name\\with//consecutive//slashes/");
                assert.strictEqual(branchName, "name/with/consecutive/slashes");
            });

            it("branch names cannot contain the sequence @{", async () => {
                const branchName = gitBranchCompatible("name@{with");
                assert.strictEqual(branchName, "name_with");
            });

            it("branch names cannot be @", async () => {
                const branchName = gitBranchCompatible("@");
                assert.strictEqual(branchName, "at");
            });

            it("branch names cannot contain backslash", async () => {
                const branchName = gitBranchCompatible("slash\\the\\wrong\\way");
                assert.strictEqual(branchName, "slash/the/wrong/way");
            });
    });

});
