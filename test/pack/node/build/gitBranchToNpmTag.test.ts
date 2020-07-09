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
import { gitBranchToNpmTag } from "../../../../lib/pack/node/build/executePublish";

describe("git branch to npm tag", () => {
    it("prefixes it with branch", () => {
        const input = "hello";
        const result = gitBranchToNpmTag(input);
        assert.equal(result, "branch-" + input);
    });

    it("replaces slash with something", () => {
        const input = "hello/branch";
        const result = gitBranchToNpmTag(input);
        assert(!result.includes("/"));
    });
});
