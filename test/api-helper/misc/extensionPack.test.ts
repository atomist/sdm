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
import { metadata } from "../../../lib/api-helper/misc/extensionPack";

describe("extensionPack", () => {

    it("should correctly read metadata from package.json", () => {
        const epm = metadata("test");
        assert.equal(epm.name, "@atomist/sdm:test");
        assert.equal(epm.vendor, "Atomist");
        assert.equal(epm.tags.length, 5);
    });

});
