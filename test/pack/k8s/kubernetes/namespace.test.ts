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
import { namespaceTemplate } from "../../../../lib/pack/k8s/kubernetes/namespace";

describe("pack/k8s/kubernetes/namespace", () => {

    describe("namespaceTemplate", () => {

        it("should return a valid template", async () => {
            const r = {
                name: "grant-lee-buffalo",
                workspaceId: "SlASHR3C0RDS",
                ns: "fuzzy",
                image: "glb/dixie-drug-store:5.07",
                sdmFulfiller: "EMI",
            };
            const n = await namespaceTemplate(r);
            const e = {
                apiVersion: "v1",
                kind: "Namespace",
                metadata: {
                    name: "fuzzy",
                    labels: {
                        "atomist.com/workspaceId": "SlASHR3C0RDS",
                        "app.kubernetes.io/managed-by": r.sdmFulfiller,
                    },
                },
            } as any;
            assert.deepStrictEqual(n, e);
        });

    });

});
