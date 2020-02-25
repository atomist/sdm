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

import { execPromise } from "@atomist/automation-client/lib/util/child_process";
import * as k8s from "@kubernetes/client-node";
import * as assert from "power-assert";
import {
    appendName,
    K8sObjectApi,
    namespaceRequired,
} from "../../../../../lib/core/pack/k8s/kubernetes/api";
import { applySpec } from "../../../../../lib/core/pack/k8s/kubernetes/apply";
import { loadKubeConfig } from "../../../../../lib/core/pack/k8s/kubernetes/config";
import { deleteSpec } from "../../../../../lib/core/pack/k8s/kubernetes/delete";
import {
    afterRetry,
    beforeRetry,
    k8sAvailable,
    rng,
} from "../k8s";

/* tslint:disable:max-file-line-count */

describe("pack/k8s/kubernetes/api", () => {

    describe("appendName", () => {

        it("should return append name", () => {
            ["delete", "patch", "read", "replace"].forEach((a: any) => {
                assert(appendName(a));
            });
        });

        it("should return not append name", () => {
            ["create", "list"].forEach((a: any) => {
                assert(!appendName(a));
            });
        });

    });

    describe("namespaceRequired", () => {

        it("should return namespace required", () => {
            const r: any = { namespaced: true };
            ["create", "delete", "patch", "read", "replace"].forEach((a: any) => {
                assert(namespaceRequired(r, a));
            });
        });

        it("should return namespace not required for list", () => {
            const r: any = { namespaced: true };
            assert(!namespaceRequired(r, "list"));
        });

        it("should return namespace not required", () => {
            const r: any = { namespaced: false };
            ["create", "delete", "list", "patch", "read", "replace"].forEach((a: any) => {
                assert(!namespaceRequired(r, a));
            });
        });

    });

    describe("integration", function(): void {

        // tslint:disable-next-line:no-invalid-this
        this.timeout(5000);

        before(async function(): Promise<void> {
            if (!await k8sAvailable()) {
                // tslint:disable-next-line:no-invalid-this
                this.skip();
            }
            beforeRetry();
        });
        after(() => {
            afterRetry();
        });

        describe("K8sObjectApi.specUriPath", () => {

            let client: K8sObjectApi;
            before(function(): void {
                try {
                    const kc = loadKubeConfig();
                    client = kc.makeApiClient(K8sObjectApi);
                } catch (e) {
                    // tslint:disable-next-line:no-invalid-this
                    this.skip();
                }
            });

            it("should return a namespaced path", async () => {
                const o = {
                    apiVersion: "v1",
                    kind: "Service",
                    metadata: {
                        name: "repeater",
                        namespace: "fugazi",
                    },
                };
                const r = await client.specUriPath(o, "patch");
                assert(r === "api/v1/namespaces/fugazi/services/repeater");
            });

            it("should default to apiVersion v1", async () => {
                const o = {
                    kind: "ServiceAccount",
                    metadata: {
                        name: "repeater",
                        namespace: "fugazi",
                    },
                };
                const r = await client.specUriPath(o, "patch");
                assert(r === "api/v1/namespaces/fugazi/serviceaccounts/repeater");
            });

            it("should default to default namespace", async () => {
                const o = {
                    apiVersion: "v1",
                    kind: "Pod",
                    metadata: {
                        name: "repeater",
                    },
                };
                const r = await client.specUriPath(o, "patch");
                assert(r === "api/v1/namespaces/default/pods/repeater");
            });

            it("should return a non-namespaced path", async () => {
                const o = {
                    apiVersion: "v1",
                    kind: "Namespace",
                    metadata: {
                        name: "repeater",
                    },
                };
                const r = await client.specUriPath(o, "delete");
                assert(r === "api/v1/namespaces/repeater");
            });

            it("should return a namespaced path without name", async () => {
                const o = {
                    apiVersion: "v1",
                    kind: "Service",
                    metadata: {
                        namespace: "fugazi",
                    },
                };
                const r = await client.specUriPath(o, "list");
                assert(r === "api/v1/namespaces/fugazi/services");
            });

            it("should return a non-namespaced path without name", async () => {
                const o = {
                    apiVersion: "v1",
                    kind: "Namespace",
                    metadata: {
                        name: "repeater",
                    },
                };
                const r = await client.specUriPath(o, "create");
                assert(r === "api/v1/namespaces");
            });

            it("should return a namespaced path for non-core resource", async () => {
                const o = {
                    apiVersion: "apps/v1",
                    kind: "Deployment",
                    metadata: {
                        name: "repeater",
                        namespace: "fugazi",
                    },
                };
                const r = await client.specUriPath(o, "read");
                assert(r === "apis/apps/v1/namespaces/fugazi/deployments/repeater");
            });

            it("should return properly pluralize", async () => {
                const o = {
                    apiVersion: "extensions/v1beta1",
                    kind: "Ingress",
                    metadata: {
                        name: "repeater",
                        namespace: "fugazi",
                    },
                };
                const r = await client.specUriPath(o, "delete");
                assert(r === "apis/extensions/v1beta1/namespaces/fugazi/ingresses/repeater");
            });

            it("should handle a variety of resources", async () => {
                /* tslint:disable:max-line-length */
                const a = [
                    { apiVersion: "v1", kind: "Service", ns: true, e: "api/v1/namespaces/fugazi/services/repeater" },
                    { apiVersion: "v1", kind: "ServiceAccount", ns: true, e: "api/v1/namespaces/fugazi/serviceaccounts/repeater" },
                    { apiVersion: "rbac.authorization.k8s.io/v1", kind: "Role", ns: true, e: "apis/rbac.authorization.k8s.io/v1/namespaces/fugazi/roles/repeater" },
                    { apiVersion: "rbac.authorization.k8s.io/v1", kind: "ClusterRole", ns: false, e: "apis/rbac.authorization.k8s.io/v1/clusterroles/repeater" },
                    { apiVersion: "extensions/v1beta1", kind: "NetworkPolicy", ns: true, e: "apis/extensions/v1beta1/namespaces/fugazi/networkpolicies/repeater" },
                    { apiVersion: "networking.k8s.io/v1", kind: "NetworkPolicy", ns: true, e: "apis/networking.k8s.io/v1/namespaces/fugazi/networkpolicies/repeater" },
                    { apiVersion: "extensions/v1beta1", kind: "Ingress", ns: true, e: "apis/extensions/v1beta1/namespaces/fugazi/ingresses/repeater" },
                    { apiVersion: "extensions/v1beta1", kind: "DaemonSet", ns: true, e: "apis/extensions/v1beta1/namespaces/fugazi/daemonsets/repeater" },
                    { apiVersion: "extensions/v1beta1", kind: "DaemonSet", ns: true, e: "apis/extensions/v1beta1/namespaces/fugazi/daemonsets/repeater" },
                    { apiVersion: "apps/v1", kind: "DaemonSet", ns: true, e: "apis/apps/v1/namespaces/fugazi/daemonsets/repeater" },
                    { apiVersion: "extensions/v1beta1", kind: "Deployment", ns: true, e: "apis/extensions/v1beta1/namespaces/fugazi/deployments/repeater" },
                    { apiVersion: "apps/v1", kind: "Deployment", ns: true, e: "apis/apps/v1/namespaces/fugazi/deployments/repeater" },
                    { apiVersion: "storage.k8s.io/v1", kind: "StorageClass", ns: false, e: "apis/storage.k8s.io/v1/storageclasses/repeater" },
                ];
                /* tslint:enable:max-line-length */
                for (const k of a) {
                    const o: k8s.KubernetesObject = {
                        apiVersion: k.apiVersion,
                        kind: k.kind,
                        metadata: {
                            name: "repeater",
                        },
                    };
                    if (k.ns) {
                        o.metadata.namespace = "fugazi";
                    }
                    const r = await client.specUriPath(o, "patch");
                    assert(r === k.e);
                }
            });

            it("should handle a variety of resources without names", async () => {
                /* tslint:disable:max-line-length */
                const a = [
                    { apiVersion: "v1", kind: "Service", ns: true, e: "api/v1/namespaces/fugazi/services" },
                    { apiVersion: "v1", kind: "ServiceAccount", ns: true, e: "api/v1/namespaces/fugazi/serviceaccounts" },
                    { apiVersion: "rbac.authorization.k8s.io/v1", kind: "Role", ns: true, e: "apis/rbac.authorization.k8s.io/v1/namespaces/fugazi/roles" },
                    { apiVersion: "rbac.authorization.k8s.io/v1", kind: "ClusterRole", ns: false, e: "apis/rbac.authorization.k8s.io/v1/clusterroles" },
                    { apiVersion: "extensions/v1beta1", kind: "NetworkPolicy", ns: true, e: "apis/extensions/v1beta1/namespaces/fugazi/networkpolicies" },
                    { apiVersion: "networking.k8s.io/v1", kind: "NetworkPolicy", ns: true, e: "apis/networking.k8s.io/v1/namespaces/fugazi/networkpolicies" },
                    { apiVersion: "extensions/v1beta1", kind: "Ingress", ns: true, e: "apis/extensions/v1beta1/namespaces/fugazi/ingresses" },
                    { apiVersion: "extensions/v1beta1", kind: "DaemonSet", ns: true, e: "apis/extensions/v1beta1/namespaces/fugazi/daemonsets" },
                    { apiVersion: "extensions/v1beta1", kind: "DaemonSet", ns: true, e: "apis/extensions/v1beta1/namespaces/fugazi/daemonsets" },
                    { apiVersion: "apps/v1", kind: "DaemonSet", ns: true, e: "apis/apps/v1/namespaces/fugazi/daemonsets" },
                    { apiVersion: "extensions/v1beta1", kind: "Deployment", ns: true, e: "apis/extensions/v1beta1/namespaces/fugazi/deployments" },
                    { apiVersion: "apps/v1", kind: "Deployment", ns: true, e: "apis/apps/v1/namespaces/fugazi/deployments" },
                    { apiVersion: "storage.k8s.io/v1", kind: "StorageClass", ns: false, e: "apis/storage.k8s.io/v1/storageclasses" },
                ];
                /* tslint:enable:max-line-length */
                for (const k of a) {
                    const o: k8s.KubernetesObject = {
                        apiVersion: k.apiVersion,
                        kind: k.kind,
                    };
                    if (k.ns) {
                        o.metadata = { namespace: "fugazi" };
                    }
                    const r = await client.specUriPath(o, "list");
                    assert(r === k.e);
                }
            });

            it("should throw an error if kind missing", async () => {
                const o = {
                    apiVersion: "v1",
                    metadata: {
                        name: "repeater",
                        namespace: "fugazi",
                    },
                };
                let thrown = false;
                try {
                    await client.specUriPath(o, "create");
                    assert.fail("should have thrown error");
                } catch (e) {
                    thrown = true;
                    assert(/Spec does not contain kind:/.test(e.message));
                }
                assert(thrown, "no error thrown");
            });

            it("should throw an error if name required and missing", async () => {
                const o = {
                    apiVersion: "v1",
                    kind: "Service",
                    metadata: {
                        namespace: "fugazi",
                    },
                };
                let thrown = false;
                try {
                    await client.specUriPath(o, "read");
                    assert.fail("should have thrown error");
                } catch (e) {
                    thrown = true;
                    assert(/Spec does not contain name:/.test(e.message));
                }
                assert(thrown, "no error thrown");
            });

            it("should throw an error if resource is not valid", async () => {
                const o = {
                    apiVersion: "v1",
                    kind: "Ingress",
                    metadata: {
                        name: "repeater",
                        namespace: "fugazi",
                    },
                };
                let thrown = false;
                try {
                    await client.specUriPath(o, "create");
                    assert.fail("should have thrown error");
                } catch (e) {
                    thrown = true;
                    assert(e.message === "Unrecognized API version and kind: v1 Ingress");
                }
                assert(thrown, "no error thrown");
            });

        });

        describe("baseRequestOptions", () => {

            let client: K8sObjectApi;
            before(function(): void {
                try {
                    const kc = loadKubeConfig();
                    client = kc.makeApiClient(K8sObjectApi);
                } catch (e) {
                    // tslint:disable-next-line:no-invalid-this
                    this.skip();
                }
            });

            it("should return default request options", async () => {
                const o = client.baseRequestOptions();
                assert(o.method === "GET");
                assert((o.uri as string).endsWith("/"));
            });

            it("should return patch request options", async () => {
                const o = client.baseRequestOptions("PATCH");
                assert(o.method === "PATCH");
                assert((o.uri as string).endsWith("/"));
                assert(o.headers["Content-Type"] === "application/strategic-merge-patch+json");
            });

            it("should return provided header", async () => {
                const o = client.baseRequestOptions("POST", { headers: { Accept: "application/json" } });
                assert(o.method === "POST");
                assert((o.uri as string).endsWith("/"));
                assert(o.headers.Accept === "application/json");
            });

            it("should return all headers when patching", async () => {
                const o = client.baseRequestOptions("PATCH", { headers: { Accept: "application/json" } });
                assert(o.method === "PATCH");
                assert((o.uri as string).endsWith("/"));
                assert(o.headers["Content-Type"] === "application/strategic-merge-patch+json");
                assert(o.headers.Accept === "application/json");
            });

            it("should override patch content-type header", async () => {
                const o = client.baseRequestOptions("PATCH", { headers: { "Content-Type": "application/merge-patch+json" } });
                assert(o.method === "PATCH");
                assert((o.uri as string).endsWith("/"));
                assert(o.headers["Content-Type"] === "application/merge-patch+json");
            });

        });

        describe("apply & delete", () => {

            it("should apply and delete resources", async () => {
                const s = {
                    apiVersion: "v1",
                    kind: "Service",
                    metadata: {
                        name: `sdm-pack-k8s-api-int-${rng()}`,
                        namespace: "default",
                    },
                    spec: {
                        ports: [
                            {
                                port: 80,
                                protocol: "TCP",
                                targetPort: 80,
                            },
                        ],
                        selector: {
                            app: "sleep",
                        },
                    },
                };
                const d = {
                    apiVersion: "apps/v1",
                    kind: "Deployment",
                    metadata: {
                        name: `sdm-pack-k8s-api-int-${rng()}`,
                        namespace: "default",
                    },
                    spec: {
                        selector: {
                            matchLabels: {
                                app: "sleep",
                            },
                        },
                        template: {
                            metadata: {
                                labels: {
                                    app: "sleep",
                                },
                            },
                            spec: {
                                containers: [
                                    {
                                        args: ["60"],
                                        command: ["sleep"],
                                        image: "alpine",
                                        name: "sleep",
                                        ports: [{ containerPort: 80 }],
                                    },
                                ],
                            },
                        },
                    },
                };
                await applySpec(s);
                await applySpec(d);
                const s0 = await execPromise("kubectl", ["get", "-n", s.metadata.namespace, "services"]);
                assert(s0.stdout.includes(s.metadata.name));
                const d0 = await execPromise("kubectl", ["get", "-n", d.metadata.namespace, "deployments"]);
                assert(d0.stdout.includes(d.metadata.name));
                await applySpec(s);
                await applySpec(d);
                const s1 = await execPromise("kubectl", ["get", "-n", s.metadata.namespace, "services"]);
                assert(s1.stdout.includes(s.metadata.name));
                const d1 = await execPromise("kubectl", ["get", "-n", d.metadata.namespace, "deployments"]);
                assert(d1.stdout.includes(d.metadata.name));
                await deleteSpec(d);
                await deleteSpec(s);
                const dl = await execPromise("kubectl", ["get", "-n", d.metadata.namespace, "deployments"]);
                assert(!dl.stdout.includes(d.metadata.name));
                const sl = await execPromise("kubectl", ["get", "-n", d.metadata.namespace, "services"]);
                assert(!sl.stdout.includes(s.metadata.name));
            }).timeout(10000);

            it("should throw a proper error", async () => {
                const s = {
                    apiVersion: "v1",
                    kind: "Service",
                    metadata: {
                        name: `_not_a_valid_name_`,
                        namespace: "default",
                    },
                    spec: {
                        ports: [
                            {
                                port: 80,
                                protocol: "TCP",
                                targetPort: 80,
                            },
                        ],
                        selector: {
                            app: "sleep",
                        },
                    },
                };
                let thrown = false;
                try {
                    await applySpec(s);
                } catch (e) {
                    thrown = true;
                    assert(/Service "_not_a_valid_name_" is invalid: metadata.name: Invalid value: "_not_a_valid_name_":/.test(e.message));
                }
                assert(thrown, "error not thrown");
                const d = {
                    apiVersion: "applications/v1",
                    kind: "Deployment",
                    metadata: {
                        name: `sdm-pack-k8s-api-int-${rng()}`,
                        namespace: "default",
                    },
                    spec: {
                        selector: {
                            matchLabels: {
                                app: "sleep",
                            },
                        },
                        template: {
                            metadata: {
                                labels: {
                                    app: "sleep",
                                },
                            },
                            spec: {
                                containers: [
                                    {
                                        args: ["60"],
                                        command: ["sleep"],
                                        image: "alpine",
                                        name: "sleep",
                                        ports: [{ containerPort: 80 }],
                                    },
                                ],
                            },
                        },
                    },
                };
                thrown = false;
                try {
                    await applySpec(d);
                } catch (e) {
                    thrown = true;
                    assert((e.message as string).startsWith("Failed to fetch resource metadata for applications/v1/Deployment: "));
                }
                assert(thrown, "error not thrown");
            });

        });

    });

});
