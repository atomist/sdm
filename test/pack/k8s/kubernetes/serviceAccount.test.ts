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
import { serviceAccountTemplate } from "../../../../lib/pack/k8s/kubernetes/serviceAccount";

describe("pack/k8s/kubernetes/serviceAccount", () => {

    describe("serviceAccountTemplate", () => {

        it("should create a service account spec", async () => {
            const r = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                sdmFulfiller: "EMI",
                roleSpec: {},
            };
            const s = await serviceAccountTemplate(r);
            const e = {
                apiVersion: "v1",
                kind: "ServiceAccount",
                metadata: {
                    labels: {
                        "app.kubernetes.io/managed-by": r.sdmFulfiller,
                        "app.kubernetes.io/name": r.name,
                        "app.kubernetes.io/part-of": r.name,
                        "atomist.com/workspaceId": r.workspaceId,
                    },
                    name: "cloudbusting",
                    namespace: "hounds-of-love",
                },
            };
            assert.deepStrictEqual(s, e);
        });

        it("should merge in provided service account spec", async () => {
            const r = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                sdmFulfiller: "EMI",
                serviceAccountSpec: {
                    metadata: {
                        annotation: {
                            "music.com/genre": "Art Rock",
                        },
                        labels: {
                            "emi.com/producer": "Kate Bush",
                        },
                    },
                },
            };
            const s = await serviceAccountTemplate(r);
            const e = {
                apiVersion: "v1",
                kind: "ServiceAccount",
                metadata: {
                    annotation: {
                        "music.com/genre": "Art Rock",
                    },
                    labels: {
                        "app.kubernetes.io/managed-by": r.sdmFulfiller,
                        "app.kubernetes.io/name": r.name,
                        "app.kubernetes.io/part-of": r.name,
                        "atomist.com/workspaceId": r.workspaceId,
                        "emi.com/producer": "Kate Bush",
                    },
                    name: "cloudbusting",
                    namespace: "hounds-of-love",
                },
            };
            assert.deepStrictEqual(s, e);
        });

        it("should merge in service account spec but fix API version and kind", async () => {
            const r = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                sdmFulfiller: "EMI",
                serviceAccountSpec: {
                    apiVersion: "extensions/v1beta1",
                    kind: "SorviceAccount",
                    metadata: {
                        annotation: {
                            "music.com/genre": "Art Rock",
                        },
                        labels: {
                            "emi.com/producer": "Kate Bush",
                        },
                    },
                },
            };
            const s = await serviceAccountTemplate(r);
            const e = {
                apiVersion: "v1",
                kind: "ServiceAccount",
                metadata: {
                    annotation: {
                        "music.com/genre": "Art Rock",
                    },
                    name: r.name,
                    namespace: "hounds-of-love",
                    labels: {
                        "app.kubernetes.io/managed-by": r.sdmFulfiller,
                        "app.kubernetes.io/name": r.name,
                        "app.kubernetes.io/part-of": r.name,
                        "atomist.com/workspaceId": r.workspaceId,
                        "emi.com/producer": "Kate Bush",
                    },
                },
            };
            assert.deepStrictEqual(s, e);
        });

        it("should allow overriding name but not namespace", async () => {
            const r = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                sdmFulfiller: "EMI",
                serviceAccountSpec: {
                    apiVersion: "extensions/v1beta1",
                    kind: "SorviceAccount",
                    metadata: {
                        annotation: {
                            "music.com/genre": "Art Rock",
                        },
                        labels: {
                            "emi.com/producer": "Kate Bush",
                        },
                        name: "wuthering-heights",
                        namespace: "the-kick-inside",
                    },
                },
            };
            const s = await serviceAccountTemplate(r);
            const e = {
                apiVersion: "v1",
                kind: "ServiceAccount",
                metadata: {
                    annotation: {
                        "music.com/genre": "Art Rock",
                    },
                    labels: {
                        "app.kubernetes.io/managed-by": r.sdmFulfiller,
                        "app.kubernetes.io/name": r.name,
                        "app.kubernetes.io/part-of": r.name,
                        "atomist.com/workspaceId": r.workspaceId,
                        "emi.com/producer": "Kate Bush",
                    },
                    name: "wuthering-heights",
                    namespace: "hounds-of-love",
                },
            };
            assert.deepStrictEqual(s, e);
        });

        it("should use provided service account name", async () => {
            const r = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                sdmFulfiller: "EMI",
                serviceAccountSpec: {
                    metadata: {
                        annotation: {
                            "music.com/genre": "Art Rock",
                        },
                        labels: {
                            "emi.com/producer": "Kate Bush",
                        },
                        name: "peter-gabriel",
                    },
                },
            };
            const s = await serviceAccountTemplate(r);
            const e = {
                apiVersion: "v1",
                kind: "ServiceAccount",
                metadata: {
                    annotation: {
                        "music.com/genre": "Art Rock",
                    },
                    labels: {
                        "app.kubernetes.io/managed-by": r.sdmFulfiller,
                        "app.kubernetes.io/name": r.name,
                        "app.kubernetes.io/part-of": r.name,
                        "atomist.com/workspaceId": r.workspaceId,
                        "emi.com/producer": "Kate Bush",
                    },
                    name: "peter-gabriel",
                    namespace: "hounds-of-love",
                },
            };
            assert.deepStrictEqual(s, e);
        });

    });

});
