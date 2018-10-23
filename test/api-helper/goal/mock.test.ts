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

import assert = require("power-assert");
import {
    MockGoalSize,
    randomize,
} from "../../../lib/api-helper/goal/mock";

describe("mock", () => {

    describe("randomize", () => {

        it("test size", () => {

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
});
