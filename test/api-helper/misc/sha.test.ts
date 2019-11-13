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
import { computeShaOf } from "../../../lib/api-helper/misc/sha";

describe("api-helper/misc/sha", () => {

    describe("computeShaOf", () => {

        it("should compute SHA512 of input", () => {
            const inputs = {
                /* tslint:disable:max-line-length */
                "The Who": "d2efc1a4e8f7beb7791295ed207a66ac236f0e643aa6591f96d15ee1a81ad471d3e61f908412adc6cd78003b59a9728aee5aa52ea9f3f4f72d85a998f46e5df2",
                "My Generation": "42b6c3cb41a7eb36d56262969e9709c01a0b264e387ca1de0f23cadadbb355d5cb2db9d87f73bcd5e4277ea4e46c6c73b12cfdf491644e55d2609f8ce83df5f7",
                "The Kids Are Alright (Edit Mono Version)": "0b4adb75c263b241f63ecc438938dc56ba2e680401fa1d5fecd3cbe585b59eb72ecbffd49fe3b3a5e684daa2370fc2ab3f2df4faf285165470cf1609ba9c231e",
                "~!@#$%^&*()_+è¡™£¢∞§¶•ªº–≠": "d0d082626e885b63621e1176dabad2196a5ac2732b4a750012d0aba893c54114851e5741c49240a61c3aae8020575db7ba3a97c4514483ab67ed0dafb98d6fc0",
                /* tslint:enable:max-line-length */
            };
            Object.keys(inputs).forEach(i => {
                const s = computeShaOf(i);
                assert(s === inputs[i]);
            });
        });

        it("should compute SHA512 of empty input", () => {
            const s = computeShaOf("");
            // tslint:disable-next-line:max-line-length
            const e = "cf83e1357eefb8bdf1542850d66d8007d620e4050b5715dc83f4a921d36ce9ce47d0d13c5d85f2b0ff8318d2877eec2f63b931bd47417a81a538327af927da3e";
            assert(s === e);
        });

        it("should throw an exception for invalid input", () => {
            // tslint:disable-next-line:no-null-keyword
            const inputs = [undefined, null];
            inputs.forEach(i => {
                assert.throws(() => computeShaOf(i), /Cannot compute SHA of undefined or null/);
            });
        });

    });

});
