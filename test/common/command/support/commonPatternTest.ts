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

import { SemVerRegExp } from "../../../../src/api/command/support/commonValidationPatterns";

describe("commonPatterns", () => {

    describe("SemVerRegExp", () => {

        it("should validate valid semantic versions", () => {
            const vs = [
                "0.0.0",
                "1.2.3",
                "10.100.1000",
                "3.1.4-1.5.9",
                "3.1.4-1.-------.9",
                "2.7.1-eight.2.eight18128",
                "43.765.4321+build.98",
                "2.7.1-eight.2.eight18128+sdm.x.y.z.4.3.2-02.02",
                "0.0.9-1.fo.213432.0123-xsd8rg.4+sdfs.34.0343-.4",
            ];
            vs.forEach(v => assert(SemVerRegExp.pattern.test(v)));
        });

        it("should reject invalid semantic versions", () => {
            const vs = [
                "huh?",
                "0.01.0",
                "1.2.3-",
                "1..1000",
                "3.1.4-1.5.09",
                "2.7.1-eight.2.eight18128+",
                "43.765.4321+build.",
                "2.7.1-eight.2.eight18128+sdm.x+y.z.4.3.2-02.02",
                "0.0.9-1.fo.213432.0123-xsd8~rg.4+sdfs.34.0343-.4",
            ];
            vs.forEach(v => assert(!SemVerRegExp.pattern.test(v)));
        });

    });

});
