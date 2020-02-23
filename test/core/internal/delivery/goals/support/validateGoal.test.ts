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
import { SdmGoalEvent } from "../../../../../../lib/api/goal/SdmGoalEvent";
import { shouldHandle } from "../../../../../../lib/core/internal/delivery/goals/support/validateGoal";

describe("shouldHandle", () => {

    it("should handle own goal", () => {
        const goal = {
            registration: "my-super-sdm",
        } as any as SdmGoalEvent;
        assert.equal(shouldHandle(goal, "my-super-sdm"), true);
    });

    it("should not handle goal of different SDM", () => {
        const goal = {
            registration: "some-super-sdm",
        } as any as SdmGoalEvent;
        assert.equal(shouldHandle(goal, "my-super-sdm"), false);
    });

    it("should handle own goal in a SDM job", () => {
        const goal = {
            registration: "my-super-sdm",
        } as any as SdmGoalEvent;
        assert.equal(shouldHandle(goal, "my-super-sdm-job-4342234-build"), true);
    });

});
