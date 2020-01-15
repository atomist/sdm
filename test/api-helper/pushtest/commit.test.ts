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

import * as assert from "assert";
import { hasCommit } from "../../../lib/api-helper/pushtest/commit";
import { fakePush } from "../../../lib/api-helper/testsupport/fakePush";

describe("commit", () => {

    describe("hasCommit", () => {

        it("should detect commit message based on pattern", async () => {
            const p = fakePush();
            p.push.commits = [
                { message: "Polish" },
                { message: "Version: increment after 1.2 release" },
            ];

            const result = await hasCommit(/Version: increment after .* release/).mapping({ ...p });
            assert.strictEqual(result, true);
        });

        it("should fail if no matching commit can be found", async () => {
            const p = fakePush();
            p.push.commits = [
                { message: "Polish" },
                { message: "Version: increment after 1.2 release" },
            ];

            const result = await hasCommit(/Autofix: TypeScript Header/).mapping({ ...p });
            assert.strictEqual(result, false);
        });

    });

});
