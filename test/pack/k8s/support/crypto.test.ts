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
import {
    decrypt,
    encrypt,
} from "../../../../lib/pack/k8s/support/crypto";

describe("pack/k8s/support/crypt", () => {

    describe("decrypt", () => {

        it("should decrypt", async () => {
            const t = "+vA/BKXOXy2rYD70EygTNQ==";
            const k = "thereisalightthatnevergoesout";
            const m = await decrypt(t, k);
            assert(m === "Th3$m1t4$");
        });

    });

    describe("encrypt", () => {

        it("should encrypt", async () => {
            const t = "Th3$m1t4$";
            const k = "thereisalightthatnevergoesout";
            const m = await encrypt(t, k);
            assert(m === "+vA/BKXOXy2rYD70EygTNQ==");
        });

    });

    describe("integration", () => {

        it("should encrypt and decrypt", async () => {
            const t = `Take me out tonight
Where there's music and there's people
And they're young and alive
Driving in your car
I never never want to go home
Because I haven't got one
Anymore`;
            const k = "thereisalightthatnevergoesout";
            const e = await encrypt(t, k);
            const o = await decrypt(e, k);
            assert(o === t);
        });

        it("should encrypt and decrypt with short key", async () => {
            const t = `Take me out tonight
Because I want to see people and I
Want to see life
Driving in your car
Oh, please don't drop me home
Because it's not my home, it's their
Home, and I'm welcome no more`;
            const k = "light";
            const e = await encrypt(t, k);
            const o = await decrypt(e, k);
            assert(o === t);
        });

    });

});
