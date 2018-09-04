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
import { testProgressReporter } from "../../../../src/api-helper/goal/progress/progress";

describe("testProgressReporter", () => {

    it("should correctly find phase", () => {
        const msg = "About to edit https://github.com/atomist/sdm-pack-spring with autofix TypeScript header";
        const reporter = testProgressReporter({
            test: /About to edit/i,
            phase: "edit",
        });
        const phase = reporter(msg, undefined);
        assert.equal(phase.phase, "edit");
    });

    it("should correctly replace groups in phase", () => {
        const msg = "About to edit https://github.com/atomist/sdm-pack-spring with autofix TypeScript header";
        const reporter = testProgressReporter({
            test: /About to edit .* autofix (.*)/i,
            phase: "$1",
        });
        const phase = reporter(msg, undefined);
        assert.equal(phase.phase, "TypeScript header");
    });

    it("should correctly replace multiple groups in phase", () => {
        const msg = "About to edit https://github.com/atomist/sdm-pack-spring with autofix TypeScript header";
        const reporter = testProgressReporter({
            test: /About to edit .* (autofix) (.*)/i,
            phase: "$2 $1 $2",
        });
        const phase = reporter(msg, undefined);
        assert.equal(phase.phase, "TypeScript header autofix TypeScript header");
    });

});
