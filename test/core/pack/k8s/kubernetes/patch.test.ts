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
import { patchHeaders } from "../../../../../lib/core/pack/k8s/kubernetes/patch";

describe("kubernetes/patch", () => {

    describe("patchHeaders", () => {

        it("should return default content type", () => {
            [undefined, {}, { patchStrategy: undefined }].forEach((a: any) => {
                const h = patchHeaders(a);
                const e = {
                    headers: {
                        "Content-Type": "application/strategic-merge-patch+json",
                    },
                };
                assert.deepStrictEqual(h, e);
            });
        });

        it("should return provided patch strategy", () => {
            ["application/merge-patch+json", "application/strategic-merge-patch+json"].forEach((s: any) => {
                const h = patchHeaders({ patchStrategy: s });
                const e = {
                    headers: {
                        "Content-Type": s,
                    },
                };
                assert.deepStrictEqual(h, e);
            });
        });

    });

});
