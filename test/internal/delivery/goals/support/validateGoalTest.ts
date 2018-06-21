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
import { SdmGoal } from "../../../../../src/api/goal/SdmGoal";
import { isGoalRelevant } from "../../../../../src/internal/delivery/goals/support/validateGoal";

describe("isGoalRelevant", () => {

    it("should handle own goal", () => {
        const goal = {
            provenance: [{
                registration: "some-other-sdm",
                ts: 2,
            }, {
                registration: "my-super-sdm",
                ts: 1,
            }, {
                registration: "again-some-other-sdm",
                ts: 3,
            }],
        } as any as SdmGoal;
        assert.equal(isGoalRelevant(goal, "my-super-sdm"), true);
    });

    it("should not handle goal of different SDM", () => {
        const goal = {
            provenance: [{
                registration: "some-other-sdm",
                ts: 3,
            }, {
                registration: "my-super-sdm",
                ts: 2,
            }, {
                registration: "again-some-other-sdm",
                ts: 1,
            }],
        } as any as SdmGoal;
        assert.equal(isGoalRelevant(goal, "my-super-sdm"), false);
    });

    it("should handle own goal in a SDM job", () => {
        const goal = {
            provenance: [{
                registration: "some-other-sdm",
                ts: 3,
            }, {
                registration: "my-super-sdm",
                ts: 1,
            }, {
                registration: "again-some-other-sdm",
                ts: 2,
            }],
        } as any as SdmGoal;
        assert.equal(isGoalRelevant(goal, "my-super-sdm-job-4342234-build"), true);
    });

});
