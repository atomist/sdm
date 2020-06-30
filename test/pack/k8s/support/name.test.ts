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

import * as assert from "power-assert";
import { cleanName } from "../../../../lib/pack/k8s/support/name";

describe("pack/k8s/support/name", () => {

    describe("cleanName", () => {

        it("should remove the leading '@'", () => {
            const n = cleanName("@atomist/k8s-sdm");
            assert(n === "atomist/k8s-sdm");
        });

        it("should leave a clean name alone", () => {
            const c = "atomist/k8s-sdm_somewhere@else";
            const n = cleanName(c);
            assert(n === c);
        });

    });

});
