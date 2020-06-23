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
import { cleanImageName } from "../../../../../lib/core/pack/docker/support/name";

describe("name", () => {
    describe("cleanName", () => {
        it("should leave valid name unchanged", () => {
            const n = "malkovich";
            const r = cleanImageName(n);
            assert(r === n);
        });

        it("should lower case name", () => {
            const n = "Malkovich";
            const r = cleanImageName(n);
            const e = "malkovich";
            assert(r === e);
        });

        it("should remove leading non-alphanumerics", () => {
            const n = "-.malkovich";
            const r = cleanImageName(n);
            const e = "malkovich";
            assert(r === e);
        });

        it("should remove trailing non-alphanumerics", () => {
            const n = "malkovich-.";
            const r = cleanImageName(n);
            const e = "malkovich";
            assert(r === e);
        });

        it("should leave internal non-alphanumerics", () => {
            const n = "mal.kov-ich";
            const r = cleanImageName(n);
            assert(r === n);
        });

        it("should remove internal non-alphanumerics for hub owners", () => {
            const n = "mal.kov-ich";
            const r = cleanImageName(n, true);
            const e = "malkovich";
            assert(r === e);
        });

        /* tslint:disable:max-line-length */
        it("should truncate name", () => {
            const n =
                "malkovichmalkovichmalkovichmalkovichmalkovichmalkovichmalkovichmalkovichmalkovichmalkovichmalkovichmalkovichmalkovichmalkovichmalkovich";
            const r = cleanImageName(n);
            const e =
                "malkovichmalkovichmalkovichmalkovichmalkovichmalkovichmalkovichmalkovichmalkovichmalkovichmalkovichmalkovichmalkovichmalkovichma";
            assert(r === e);
        });

        it("should truncate name on alphanumeric", () => {
            const n =
                "malkovichmalkovichmalkovichmalkovichmalkovichmalkovichmalkovichmalkovichmalkovichmalkovichmalkovichmalkovichmalkovich-----------------h";
            const r = cleanImageName(n);
            const e =
                "malkovichmalkovichmalkovichmalkovichmalkovichmalkovichmalkovichmalkovichmalkovichmalkovichmalkovichmalkovichmalkovich";
            assert(r === e);
        });
        /* tslint:enable:max-line-length */
    });
});
