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


import * as assert from "assert";
import { toFlattenedProperties } from "../../../../src/api/command/support/buttons";

describe("toFlattenedProperties", () => {

    it("should handle undefined", () => {
        const props = toFlattenedProperties(undefined);
        assert.deepEqual(props, {});
    });

    it("should handle simple property", () => {
        const props = toFlattenedProperties({ name: "Fred" });
        assert.deepEqual(props, { name: "Fred" });
    });

    it("should handle nested property", () => {
        const props = toFlattenedProperties({ name: "Fred", address: { street: "somewhere" } });
        assert.deepEqual(props, { "name": "Fred", "address.street": "somewhere" });
    });

    it("should handle nested nested property", () => {
        const props = toFlattenedProperties({ name: "Fred", address: { street: "somewhere", zip: { code: "12345" } } });
        assert.deepEqual(props, { "name": "Fred", "address.street": "somewhere", "address.zip.code": "12345" });
    });
});
