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
import {
    mockGoalExecutor,
    MockGoalSize,
    randomize,
} from "../../../lib/api-helper/goal/mock";
import { fakePush } from "../../../lib/api-helper/testsupport/fakePush";
import { Autofix } from "../../../lib/api/goal/common/Autofix";
import { SdmGoalEvent } from "../../../lib/api/goal/SdmGoalEvent";

describe("mock", () => {

    describe("randomize", () => {

        it("should return correct random period", () => {

            const verify = (size, randomBy = 0.2) => {
                const min = size - (size * randomBy);
                const max = size + (size * randomBy);
                const result = randomize(size, randomBy);
                assert(result >= min);
                assert(result <= max);
            };

            verify(MockGoalSize.ExtraLarge);
            verify(MockGoalSize.ExtraLarge);
            verify(MockGoalSize.ExtraLarge);

            verify(MockGoalSize.Small);
            verify(MockGoalSize.Small);
            verify(MockGoalSize.Small);
            verify(MockGoalSize.Small);

            verify(MockGoalSize.Medium);
            verify(MockGoalSize.Medium);
            verify(MockGoalSize.Medium);
            verify(MockGoalSize.Medium);

        });

    });

    describe("mockGoalExecutor", () => {

        const goal: SdmGoalEvent = {
            push: fakePush().push,
        } as any;

        it("should return no mock goal executor if not enabled", () => {
            assert(!mockGoalExecutor(new Autofix(), goal, {} as any));
        });

        it("should return mock goal executor with boolean enable", () => {
            const config = {
                sdm: {
                    mock: {
                        enabled: true,
                    },
                },
            };
            assert(!!mockGoalExecutor(new Autofix(), goal, config as any));
        });

        it("should return provided mock goal executor", async () => {
            const autofix = new Autofix();
            let executed = false;
            const config = {
                sdm: {
                    mock: {
                        enabled: true,
                        goals: [{
                            goal: autofix,
                            mock: () => {
                                executed = true;
                                return {
                                    code: 0,
                                };
                            },
                        },
                        ],
                    },

                },
            };
            await mockGoalExecutor(autofix, goal, config as any)({} as any);
            assert(executed);
        });

        it("should return mock goal executor with enable function", () => {
            const config = {
                sdm: {
                    mock: {
                        enabled: (g: SdmGoalEvent) => g.push.after.message.includes("test"),
                    },
                },
            };
            goal.push.after.message = "Fix tests";
            assert(!!mockGoalExecutor(new Autofix(), goal, config as any));
            goal.push.after.message = "No more";
            assert(!mockGoalExecutor(new Autofix(), goal, config as any));
        });

    });
});
