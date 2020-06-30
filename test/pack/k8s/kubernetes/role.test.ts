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
    clusterRoleTemplate,
    roleTemplate,
} from "../../../../lib/pack/k8s/kubernetes/role";

/* tslint:disable:max-file-line-count */

describe("pack/k8s/kubernetes/role", () => {

    describe("roleTemplate", () => {

        it("should create a role spec", async () => {
            const r = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                sdmFulfiller: "EMI",
                roleSpec: {},
            };
            const s = await roleTemplate(r);
            const e = {
                apiVersion: "rbac.authorization.k8s.io/v1",
                kind: "Role",
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
                rules: [] as any,
            };
            assert.deepStrictEqual(s, e);
        });

        it("should merge in provided role spec", async () => {
            const r = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                sdmFulfiller: "EMI",
                roleSpec: {
                    metadata: {
                        annotation: {
                            "music.com/genre": "Art Rock",
                        },
                        labels: {
                            "emi.com/producer": "Kate Bush",
                        },
                    },
                    rules: [
                        {
                            apiGroups: [""],
                            resources: ["services"],
                            verbs: ["get", "watch", "list"],
                        },
                        {
                            apiGroups: [""],
                            resources: ["pods"],
                            verbs: ["get", "watch", "list"],
                        },
                        {
                            apiGroups: ["extensions"],
                            resources: ["ingresses"],
                            verbs: ["get", "watch", "list"],
                        },
                        {
                            apiGroups: [""],
                            resources: ["nodes"],
                            verbs: ["list"],
                        },
                    ],
                },
            };
            const s = await roleTemplate(r);
            const e = {
                apiVersion: "rbac.authorization.k8s.io/v1",
                kind: "Role",
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
                rules: [
                    {
                        apiGroups: [""],
                        resources: ["services"],
                        verbs: ["get", "watch", "list"],
                    },
                    {
                        apiGroups: [""],
                        resources: ["pods"],
                        verbs: ["get", "watch", "list"],
                    },
                    {
                        apiGroups: ["extensions"],
                        resources: ["ingresses"],
                        verbs: ["get", "watch", "list"],
                    },
                    {
                        apiGroups: [""],
                        resources: ["nodes"],
                        verbs: ["list"],
                    },
                ],
            };
            assert.deepStrictEqual(s, e);
        });

        it("should merge in role spec fixing API version and kind", async () => {
            const r = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                sdmFulfiller: "EMI",
                roleSpec: {
                    apiVersion: "v1",
                    kind: "Roll",
                    metadata: {
                        annotation: {
                            "music.com/genre": "Art Rock",
                        },
                        labels: {
                            "emi.com/producer": "Kate Bush",
                        },
                    },
                    rules: [
                        {
                            apiGroups: [""],
                            resources: ["services"],
                            verbs: ["get", "watch", "list"],
                        },
                        {
                            apiGroups: [""],
                            resources: ["pods"],
                            verbs: ["get", "watch", "list"],
                        },
                        {
                            apiGroups: ["extensions"],
                            resources: ["ingresses"],
                            verbs: ["get", "watch", "list"],
                        },
                        {
                            apiGroups: [""],
                            resources: ["nodes"],
                            verbs: ["list"],
                        },
                    ],
                },
            };
            const s = await roleTemplate(r);
            const e = {
                apiVersion: "rbac.authorization.k8s.io/v1",
                kind: "Role",
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
                rules: [
                    {
                        apiGroups: [""],
                        resources: ["services"],
                        verbs: ["get", "watch", "list"],
                    },
                    {
                        apiGroups: [""],
                        resources: ["pods"],
                        verbs: ["get", "watch", "list"],
                    },
                    {
                        apiGroups: ["extensions"],
                        resources: ["ingresses"],
                        verbs: ["get", "watch", "list"],
                    },
                    {
                        apiGroups: [""],
                        resources: ["nodes"],
                        verbs: ["list"],
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
                roleSpec: {
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
                    rules: [
                        {
                            apiGroups: [""],
                            resources: ["services"],
                            verbs: ["get", "watch", "list"],
                        },
                        {
                            apiGroups: [""],
                            resources: ["pods"],
                            verbs: ["get", "watch", "list"],
                        },
                        {
                            apiGroups: ["extensions"],
                            resources: ["ingresses"],
                            verbs: ["get", "watch", "list"],
                        },
                        {
                            apiGroups: [""],
                            resources: ["nodes"],
                            verbs: ["list"],
                        },
                    ],
                },
            };
            const s = await roleTemplate(r);
            const e = {
                apiVersion: "rbac.authorization.k8s.io/v1",
                kind: "Role",
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
                rules: [
                    {
                        apiGroups: [""],
                        resources: ["services"],
                        verbs: ["get", "watch", "list"],
                    },
                    {
                        apiGroups: [""],
                        resources: ["pods"],
                        verbs: ["get", "watch", "list"],
                    },
                    {
                        apiGroups: ["extensions"],
                        resources: ["ingresses"],
                        verbs: ["get", "watch", "list"],
                    },
                    {
                        apiGroups: [""],
                        resources: ["nodes"],
                        verbs: ["list"],
                    },
                ],
            };
            assert.deepStrictEqual(s, e);
        });

    });

    describe("clusterRoleTemplate", () => {

        it("should create a cluster role spec", async () => {
            const r = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                sdmFulfiller: "EMI",
                roleSpec: { kind: "ClusterRole" },
            };
            const s = await clusterRoleTemplate(r);
            const e = {
                apiVersion: "rbac.authorization.k8s.io/v1",
                kind: "ClusterRole",
                metadata: {
                    name: r.name,
                    labels: {
                        "app.kubernetes.io/managed-by": r.sdmFulfiller,
                        "app.kubernetes.io/name": r.name,
                        "app.kubernetes.io/part-of": r.name,
                        "atomist.com/workspaceId": r.workspaceId,
                    },
                },
                rules: [] as any,
            };
            assert.deepStrictEqual(s, e);
        });

        it("should merge in provided cluster role spec", async () => {
            const r = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                sdmFulfiller: "EMI",
                roleSpec: {
                    kind: "ClusterRole",
                    metadata: {
                        annotation: {
                            "music.com/genre": "Art Rock",
                        },
                        labels: {
                            "emi.com/producer": "Kate Bush",
                        },
                    },
                    rules: [
                        {
                            apiGroups: [""],
                            resources: ["services"],
                            verbs: ["get", "watch", "list"],
                        },
                        {
                            apiGroups: [""],
                            resources: ["pods"],
                            verbs: ["get", "watch", "list"],
                        },
                        {
                            apiGroups: ["extensions"],
                            resources: ["ingresses"],
                            verbs: ["get", "watch", "list"],
                        },
                        {
                            apiGroups: [""],
                            resources: ["nodes"],
                            verbs: ["list"],
                        },
                    ],
                },
            };
            const s = await clusterRoleTemplate(r);
            const e = {
                apiVersion: "rbac.authorization.k8s.io/v1",
                kind: "ClusterRole",
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
                rules: [
                    {
                        apiGroups: [""],
                        resources: ["services"],
                        verbs: ["get", "watch", "list"],
                    },
                    {
                        apiGroups: [""],
                        resources: ["pods"],
                        verbs: ["get", "watch", "list"],
                    },
                    {
                        apiGroups: ["extensions"],
                        resources: ["ingresses"],
                        verbs: ["get", "watch", "list"],
                    },
                    {
                        apiGroups: [""],
                        resources: ["nodes"],
                        verbs: ["list"],
                    },
                ],
            };
            assert.deepStrictEqual(s, e);
        });

        it("should merge in cluster role spec fixing API version", async () => {
            const r = {
                workspaceId: "KAT3BU5H",
                ns: "hounds-of-love",
                name: "cloudbusting",
                image: "gcr.io/kate-bush/hounds-of-love/cloudbusting:5.5.10",
                sdmFulfiller: "EMI",
                roleSpec: {
                    apiVersion: "v1",
                    kind: "ClusterRole",
                    metadata: {
                        annotation: {
                            "music.com/genre": "Art Rock",
                        },
                        labels: {
                            "emi.com/producer": "Kate Bush",
                        },
                    },
                    rules: [
                        {
                            apiGroups: [""],
                            resources: ["services"],
                            verbs: ["get", "watch", "list"],
                        },
                        {
                            apiGroups: [""],
                            resources: ["pods"],
                            verbs: ["get", "watch", "list"],
                        },
                        {
                            apiGroups: ["extensions"],
                            resources: ["ingresses"],
                            verbs: ["get", "watch", "list"],
                        },
                        {
                            apiGroups: [""],
                            resources: ["nodes"],
                            verbs: ["list"],
                        },
                    ],
                },
            };
            const s = await clusterRoleTemplate(r);
            const e = {
                apiVersion: "rbac.authorization.k8s.io/v1",
                kind: "ClusterRole",
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
                rules: [
                    {
                        apiGroups: [""],
                        resources: ["services"],
                        verbs: ["get", "watch", "list"],
                    },
                    {
                        apiGroups: [""],
                        resources: ["pods"],
                        verbs: ["get", "watch", "list"],
                    },
                    {
                        apiGroups: ["extensions"],
                        resources: ["ingresses"],
                        verbs: ["get", "watch", "list"],
                    },
                    {
                        apiGroups: [""],
                        resources: ["nodes"],
                        verbs: ["list"],
                    },
                ],
            };
            assert.deepStrictEqual(s, e);
        });

    });

});
