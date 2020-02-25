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

import * as k8s from "@kubernetes/client-node";
import * as assert from "power-assert";
import { KubernetesDelete } from "../../../../../lib/core/pack/k8s/kubernetes/request";
import {
    appObject,
    k8sObject,
    logObject,
} from "../../../../../lib/core/pack/k8s/kubernetes/resource";

describe("pack/k8s/kubernetes/resource", () => {

    describe("appObject", () => {

        it("should throw an exception if kind invalid", () => {
            [undefined, "", "Nothing"].forEach(k => {
                const a: KubernetesDelete = {
                    name: "good-girl-gone-bad",
                    ns: "rihanna",
                    workspaceId: "AR14NN4",
                };
                assert.throws(() => appObject(a, k), /Unsupported kind of Kubernetes resource object:/);
            });
        });

        it("should return a namespace object", () => {
            const a: KubernetesDelete = {
                name: "good-girl-gone-bad",
                ns: "rihanna",
                workspaceId: "AR14NN4",
            };
            const o = appObject(a, "Namespace");
            const e = {
                apiVersion: "v1",
                kind: "Namespace",
                metadata: {
                    labels: {
                        "app.kubernetes.io/name": "good-girl-gone-bad",
                        "atomist.com/workspaceId": "AR14NN4",
                    },
                    name: "rihanna",
                },
            };
            assert.deepStrictEqual(o, e);
        });

        it("should return a v1 namespaced object", () => {
            ["Secret", "Service", "ServiceAccount"].forEach(k => {
                const a: KubernetesDelete = {
                    name: "good-girl-gone-bad",
                    ns: "rihanna",
                    workspaceId: "AR14NN4",
                };
                const o = appObject(a, k);
                const e = {
                    apiVersion: "v1",
                    kind: k,
                    metadata: {
                        labels: {
                            "app.kubernetes.io/name": "good-girl-gone-bad",
                            "atomist.com/workspaceId": "AR14NN4",
                        },
                        name: "good-girl-gone-bad",
                        namespace: "rihanna",
                    },
                };
                assert.deepStrictEqual(o, e);
            });
        });

        it("should return a v1beta1 namespaced object", () => {
            const a: KubernetesDelete = {
                name: "good-girl-gone-bad",
                ns: "rihanna",
                workspaceId: "AR14NN4",
            };
            const o = appObject(a, "Ingress");
            const e = {
                apiVersion: "extensions/v1beta1",
                kind: "Ingress",
                metadata: {
                    labels: {
                        "app.kubernetes.io/name": "good-girl-gone-bad",
                        "atomist.com/workspaceId": "AR14NN4",
                    },
                    name: "good-girl-gone-bad",
                    namespace: "rihanna",
                },
            };
            assert.deepStrictEqual(o, e);
        });

        it("should return a namespaced apps object", () => {
            const a: KubernetesDelete = {
                name: "good-girl-gone-bad",
                ns: "rihanna",
                workspaceId: "AR14NN4",
            };
            const o = appObject(a, "Deployment");
            const e = {
                apiVersion: "apps/v1",
                kind: "Deployment",
                metadata: {
                    labels: {
                        "app.kubernetes.io/name": "good-girl-gone-bad",
                        "atomist.com/workspaceId": "AR14NN4",
                    },
                    name: "good-girl-gone-bad",
                    namespace: "rihanna",
                },
            };
            assert.deepStrictEqual(o, e);
        });

        it("should return a namespaced RBAC object", () => {
            ["Role", "RoleBinding"].forEach(k => {
                const a: KubernetesDelete = {
                    name: "good-girl-gone-bad",
                    ns: "rihanna",
                    workspaceId: "AR14NN4",
                };
                const o = appObject(a, k);
                const e = {
                    apiVersion: "rbac.authorization.k8s.io/v1",
                    kind: k,
                    metadata: {
                        labels: {
                            "app.kubernetes.io/name": "good-girl-gone-bad",
                            "atomist.com/workspaceId": "AR14NN4",
                        },
                        name: "good-girl-gone-bad",
                        namespace: "rihanna",
                    },
                };
                assert.deepStrictEqual(o, e);
            });
        });

        it("should return a cluster RBAC object", () => {
            ["ClusterRole", "ClusterRoleBinding"].forEach(k => {
                const a: KubernetesDelete = {
                    name: "good-girl-gone-bad",
                    ns: "rihanna",
                    workspaceId: "AR14NN4",
                };
                const o = appObject(a, k);
                const e = {
                    apiVersion: "rbac.authorization.k8s.io/v1",
                    kind: k,
                    metadata: {
                        labels: {
                            "app.kubernetes.io/name": "good-girl-gone-bad",
                            "atomist.com/workspaceId": "AR14NN4",
                        },
                        name: "good-girl-gone-bad",
                    },
                };
                assert.deepStrictEqual(o, e);
            });
        });

    });

    describe("k8sObject", () => {

        it("should return a minimal object from a service account", () => {
            const d: k8s.V1ServiceAccount = {
                apiVersion: "v1",
                kind: "ServiceAccount",
                metadata: {
                    labels: {
                        "app.kubernetes.io/name": "good-girl-gone-bad",
                        "atomist.com/workspaceId": "AR14NN4",
                    },
                    name: "good-girl-gone-bad",
                    namespace: "rihanna",
                },
            };
            const o = k8sObject(d);
            assert.deepStrictEqual(o, d);
        });

        it("should return a minimal object from a deployment", () => {
            const d: k8s.V1Deployment = {
                apiVersion: "apps/v1",
                kind: "Deployment",
                metadata: {
                    labels: {
                        "app.kubernetes.io/name": "good-girl-gone-bad",
                        "atomist.com/workspaceId": "AR14NN4",
                    },
                    name: "good-girl-gone-bad",
                    namespace: "rihanna",
                },
                spec: {
                    selector: {},
                    template: {
                        spec: {
                            containers: [
                                {
                                    image: "umbrella:4.36",
                                    name: "umbrella",
                                },
                            ],
                        },
                    },
                },
            };
            const o = k8sObject(d);
            const e = {
                apiVersion: "apps/v1",
                kind: "Deployment",
                metadata: {
                    labels: {
                        "app.kubernetes.io/name": "good-girl-gone-bad",
                        "atomist.com/workspaceId": "AR14NN4",
                    },
                    name: "good-girl-gone-bad",
                    namespace: "rihanna",
                },
            };
            assert.deepStrictEqual(o, e);
        });

    });

    describe("stringifyObject", () => {

        it("should stringify a service", () => {
            const d: k8s.V1Service = {
                apiVersion: "v1",
                kind: "Service",
                metadata: {
                    name: "good-girl-gone-bad",
                    namespace: "rihanna",
                },
                spec: {
                    ports: [{ port: 8080 }],
                },
            };
            const s = logObject(d);
            // tslint:disable-next-line:max-line-length
            const e = `{"apiVersion":"v1","kind":"Service","metadata":{"name":"good-girl-gone-bad","namespace":"rihanna"},"spec":{"ports":[{"port":8080}]}}`;
            assert(s === e);
        });

        it("should stringify and truncate a deployment", () => {
            const d: k8s.V1Deployment = {
                apiVersion: "apps/v1",
                kind: "Deployment",
                metadata: {
                    labels: {
                        "app.kubernetes.io/name": "good-girl-gone-bad",
                        "atomist.com/workspaceId": "AR14NN4",
                    },
                    name: "good-girl-gone-bad",
                    namespace: "rihanna",
                },
                spec: {
                    selector: {},
                    template: {
                        spec: {
                            containers: [
                                {
                                    image: "umbrella:4.36",
                                    name: "umbrella",
                                },
                            ],
                        },
                    },
                },
            };
            const s = logObject(d);
            // tslint:disable-next-line:max-line-length
            const e = `{"apiVersion":"apps/v1","kind":"Deployment","metadata":{"labels":{"app.kubernetes.io/name":"good-girl-gone-bad","atomist.com/workspaceId":"AR14NN4"},"name":"good-girl-gone-bad","namespace":"rihann...}`;
            assert(s === e);
        });

        it("should remove data values from a secret", () => {
            const d: k8s.V1Secret = {
                apiVersion: "v1",
                data: {
                    One: "VW1icmVsbGEgKGZlYXQuIEpheS1aKQ==",
                    Two: "UHVzaCBVcCBvbiBNZQ==",
                    Seven: "U2F5IEl0",
                },
                kind: "Secret",
                metadata: {
                    labels: {
                        "app.kubernetes.io/name": "good-girl-gone-bad",
                        "atomist.com/workspaceId": "AR14NN4",
                    },
                    name: "good-girl-gone-bad",
                    namespace: "rihanna",
                },
            };
            const s = logObject(d);
            // tslint:disable-next-line:max-line-length
            const e = `{"apiVersion":"v1","data":{"One":"V******************************=","Two":"U******************=","Seven":"********"},"kind":"Secret","metadata":{"labels":{"app.kubernetes.io/name":"good-girl-gone-...}`;
            assert(s === e);
        });

    });

});
