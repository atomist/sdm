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

import { Configuration } from "@atomist/automation-client/lib/configuration";
import * as assert from "power-assert";
import { cancelableGoal } from "../../../lib/api-helper/listener/cancelGoals";

describe("cancelGoals", () => {

    describe("cancelableGoal", () => {

        it("should match allow to cancel", async () => {
            const config: Configuration = {
                sdm: {
                    goal: {
                        uncancelable: ["persistent goal"],
                    },
                },
            };

            assert.equal(await cancelableGoal({
                uniqueName: "transient goal",
                name: "Some really persistent goal",
            } as any, config), true);
        });

        it("should match not allow to cancel", async () => {
            const config: Configuration = {
                sdm: {
                    goal: {
                        uncancelable: ["other goal", "persistent goal"],
                    },
                },
            };

            assert.equal(await cancelableGoal({
                uniqueName: "persistent goal",
                name: "Some really persistent goal",
            } as any, config), false);

            assert.equal(await cancelableGoal({
                uniqueName: "other-goal",
                name: "other goal",
            } as any, config), false);
        });

    });
});
