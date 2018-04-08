/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import "mocha";
import { SingleProjectLoader } from "../../../SingleProjectLoader";
import { executeAutofixes } from "../../../../../src/common/delivery/code/autofix/executeAutofixes";
import * as assert from "power-assert";
import { fakeRunWithLogContext } from "../fakeRunWithLogContext";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";

describe("executeAutofixes", () => {

    it("should execute none", async() => {
        const id = new GitHubRepoRef("a", "b");
        const pl = new SingleProjectLoader({ id } as any);
        const r = await executeAutofixes(pl, [])(fakeRunWithLogContext(id));
        assert(r.code === 0);
    });

});
