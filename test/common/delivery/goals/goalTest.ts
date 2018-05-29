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
import { MessageGoal } from "../../../../src/api/goal/common/MessageGoal";

describe("Goal", () => {

    it("should require camel case name", () => {
        [" bad name", "#234029384", "1tttt", "3Ter"].forEach(rejectName);
    });

    it("should accept camel case name", () => {
        ["camelCase", "UpperCamel"].forEach(name => new MessageGoal(name));
    });
});

function rejectName(name: string) {
    assert.throws(() => new MessageGoal(name),
        `Should reject goal name '${name}'`);
}
