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

import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";

import * as assert from "power-assert";
import { PushRule } from "../../../../src/api/mapping/support/PushRule";
import { TruePushTest } from "./pushTestUtilsTest";

describe("PushRule", () => {

    it("should set literal value", async () => {
        const pr = new PushRule<string>(TruePushTest, [], "reason");
        pr.set("frogs");
        assert.equal(await pr.mapping({
            push: { id: new Date().getTime() + "_"},
            id: new GitHubRepoRef("a", "b"),
        } as any), "frogs");
    });

});
