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
    clusterRoleBindingTemplate,
    roleBindingTemplate,
} from "../../../../lib/pack/k8s/kubernetes/roleBinding";

describe("pack/k8s/kubernetes/roleBinding", () => {

    describe("roleBindingTemplate", () => {

        it("should create a role binding spec", async () => {
            const r = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                sdmFulfiller: "EMI",
                roleSpec: {},
            };
            const s = await roleBindingTemplate(r);
            const e = {
                apiVersion: "rbac.authorization.k8s.io/v1",
                kind: "RoleBinding",
                metadata: {
                    name: r.name,
                    namespace: r.ns,
                    labels: {
                        "app.kubernetes.io/managed-by": r.sdmFulfiller,
                        "app.kubernetes.io/name": r.name,
                        "app.kubernetes.io/part-of": r.name,
                        "atomist.com/workspaceId": r.workspaceId,
                    },
                },
                roleRef: {
                    apiGroup: "rbac.authorization.k8s.io",
                    kind: "Role",
                    name: r.name,
                },
                subjects: [
                    {
                        kind: "ServiceAccount",
                        name: r.name,
                    },
                ],
            };
            assert.deepStrictEqual(s, e);
        });

        it("should merge in provided role binding spec", async () => {
            const r = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                sdmFulfiller: "EMI",
                roleBindingSpec: {
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
            const s = await roleBindingTemplate(r);
            const e = {
                apiVersion: "rbac.authorization.k8s.io/v1",
                kind: "RoleBinding",
                metadata: {
                    annotation: {
                        "music.com/genre": "Art Rock",
                    },
                    name: r.name,
                    namespace: r.ns,
                    labels: {
                        "app.kubernetes.io/managed-by": r.sdmFulfiller,
                        "app.kubernetes.io/name": r.name,
                        "app.kubernetes.io/part-of": r.name,
                        "atomist.com/workspaceId": r.workspaceId,
                        "emi.com/producer": "Kate Bush",
                    },
                },
                roleRef: {
                    apiGroup: "rbac.authorization.k8s.io",
                    kind: "Role",
                    name: r.name,
                },
                subjects: [
                    {
                        kind: "ServiceAccount",
                        name: r.name,
                    },
                ],
            };
            assert.deepStrictEqual(s, e);
        });

        it("should merge in role binding spec fixing API version and kind", async () => {
            const r = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                sdmFulfiller: "EMI",
                roleBindingSpec: {
                    apiVersion: "v1",
                    kind: "RollBinding",
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
            const s = await roleBindingTemplate(r);
            const e = {
                apiVersion: "rbac.authorization.k8s.io/v1",
                kind: "RoleBinding",
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
                roleRef: {
                    apiGroup: "rbac.authorization.k8s.io",
                    kind: "Role",
                    name: r.name,
                },
                subjects: [
                    {
                        kind: "ServiceAccount",
                        name: r.name,
                    },
                ],
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
                roleBindingSpec: {
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
            const s = await roleBindingTemplate(r);
            const e = {
                apiVersion: "rbac.authorization.k8s.io/v1",
                kind: "RoleBinding",
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
                roleRef: {
                    apiGroup: "rbac.authorization.k8s.io",
                    kind: "Role",
                    name: r.name,
                },
                subjects: [
                    {
                        kind: "ServiceAccount",
                        name: r.name,
                    },
                ],
            };
            assert.deepStrictEqual(s, e);
        });

        it("should create a role binding spec with provided service account", async () => {
            const r = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                sdmFulfiller: "EMI",
                roleSpec: {},
                serviceAccountSpec: {
                    metadata: {
                        name: "peter-gabriel",
                    },
                },
            };
            const s = await roleBindingTemplate(r);
            const e = {
                apiVersion: "rbac.authorization.k8s.io/v1",
                kind: "RoleBinding",
                metadata: {
                    name: r.name,
                    namespace: r.ns,
                    labels: {
                        "app.kubernetes.io/managed-by": r.sdmFulfiller,
                        "app.kubernetes.io/name": r.name,
                        "app.kubernetes.io/part-of": r.name,
                        "atomist.com/workspaceId": r.workspaceId,
                    },
                },
                roleRef: {
                    apiGroup: "rbac.authorization.k8s.io",
                    kind: "Role",
                    name: r.name,
                },
                subjects: [
                    {
                        kind: "ServiceAccount",
                        name: "peter-gabriel",
                    },
                ],
            };
            assert.deepStrictEqual(s, e);
        });

    });

    describe("clusterRoleBindingTemplate", () => {

        it("should create a cluster role binding spec", async () => {
            const r = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                sdmFulfiller: "EMI",
                roleSpec: {},
            };
            const s = await clusterRoleBindingTemplate(r);
            const e = {
                apiVersion: "rbac.authorization.k8s.io/v1",
                kind: "ClusterRoleBinding",
                metadata: {
                    name: r.name,
                    labels: {
                        "app.kubernetes.io/managed-by": r.sdmFulfiller,
                        "app.kubernetes.io/name": r.name,
                        "app.kubernetes.io/part-of": r.name,
                        "atomist.com/workspaceId": r.workspaceId,
                    },
                },
                roleRef: {
                    apiGroup: "rbac.authorization.k8s.io",
                    kind: "ClusterRole",
                    name: r.name,
                },
                subjects: [
                    {
                        kind: "ServiceAccount",
                        name: r.name,
                        namespace: r.ns,
                    },
                ],
            };
            assert.deepStrictEqual(s, e);
        });

        it("should merge in provided cluster role binding spec", async () => {
            const r = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                sdmFulfiller: "EMI",
                roleBindingSpec: {
                    kind: "ClusterRoleBinding",
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
            const s = await clusterRoleBindingTemplate(r);
            const e = {
                apiVersion: "rbac.authorization.k8s.io/v1",
                kind: "ClusterRoleBinding",
                metadata: {
                    annotation: {
                        "music.com/genre": "Art Rock",
                    },
                    name: r.name,
                    labels: {
                        "app.kubernetes.io/managed-by": r.sdmFulfiller,
                        "app.kubernetes.io/name": r.name,
                        "app.kubernetes.io/part-of": r.name,
                        "atomist.com/workspaceId": r.workspaceId,
                        "emi.com/producer": "Kate Bush",
                    },
                },
                roleRef: {
                    apiGroup: "rbac.authorization.k8s.io",
                    kind: "ClusterRole",
                    name: r.name,
                },
                subjects: [
                    {
                        kind: "ServiceAccount",
                        name: r.name,
                        namespace: r.ns,
                    },
                ],
            };
            assert.deepStrictEqual(s, e);
        });

        it("should merge in cluster role binding spec fixing API version", async () => {
            const r = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                sdmFulfiller: "EMI",
                roleBindingSpec: {
                    apiVersion: "v1",
                    kind: "ClusterRoleBinding",
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
            const s = await clusterRoleBindingTemplate(r);
            const e = {
                apiVersion: "rbac.authorization.k8s.io/v1",
                kind: "ClusterRoleBinding",
                metadata: {
                    annotation: {
                        "music.com/genre": "Art Rock",
                    },
                    name: r.name,
                    labels: {
                        "app.kubernetes.io/managed-by": r.sdmFulfiller,
                        "app.kubernetes.io/name": r.name,
                        "app.kubernetes.io/part-of": r.name,
                        "atomist.com/workspaceId": r.workspaceId,
                        "emi.com/producer": "Kate Bush",
                    },
                },
                roleRef: {
                    apiGroup: "rbac.authorization.k8s.io",
                    kind: "ClusterRole",
                    name: r.name,
                },
                subjects: [
                    {
                        kind: "ServiceAccount",
                        name: r.name,
                        namespace: r.ns,
                    },
                ],
            };
            assert.deepStrictEqual(s, e);
        });

        it("should create a cluster role binding spec with provided service account", async () => {
            const r = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                sdmFulfiller: "EMI",
                roleSpec: {},
                serviceAccountSpec: {
                    metadata: {
                        name: "peter-gabriel",
                    },
                },
            };
            const s = await clusterRoleBindingTemplate(r);
            const e = {
                apiVersion: "rbac.authorization.k8s.io/v1",
                kind: "ClusterRoleBinding",
                metadata: {
                    name: r.name,
                    labels: {
                        "app.kubernetes.io/managed-by": r.sdmFulfiller,
                        "app.kubernetes.io/name": r.name,
                        "app.kubernetes.io/part-of": r.name,
                        "atomist.com/workspaceId": r.workspaceId,
                    },
                },
                roleRef: {
                    apiGroup: "rbac.authorization.k8s.io",
                    kind: "ClusterRole",
                    name: r.name,
                },
                subjects: [
                    {
                        kind: "ServiceAccount",
                        name: "peter-gabriel",
                        namespace: r.ns,
                    },
                ],
            };
            assert.deepStrictEqual(s, e);
        });

    });

});
