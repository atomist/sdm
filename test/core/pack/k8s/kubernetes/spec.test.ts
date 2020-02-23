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
    kubernetesSpecFileBasename,
    kubernetesSpecStringify,
    parseKubernetesSpecs,
    specSlug,
    specSnippet,
    specStringSnippet,
} from "../../../../../lib/core/pack/k8s/kubernetes/spec";

/* tslint:disable:max-file-line-count */

describe("pack/k8s/kubernetes/spec", () => {

    describe("kubernetesSpecFileBasename", () => {

        it("should create a namespace file name", () => {
            const o = {
                apiVersion: "v1",
                kind: "Namespace",
                metadata: {
                    name: "lyle",
                },
            };
            const s = kubernetesSpecFileBasename(o);
            assert(s === "10_lyle_namespace");
        });

        it("should create a simple namespaced file name", () => {
            [
                { a: "apps/v1", k: "Deployment", p: "70" },
                { a: "extensions/v1beta1", k: "Ingress", p: "80" },
                { a: "rbac.authorization.k8s.io/v1", k: "Role", p: "25" },
                { a: "v1", k: "Secret", p: "60" },
                { a: "v1", k: "Service", p: "50" },
            ].forEach(r => {
                const o = {
                    apiVersion: r.a,
                    kind: r.k,
                    metadata: {
                        name: "lyle",
                        namespace: "lovett",
                    },
                };
                const s = kubernetesSpecFileBasename(o);
                const e = r.p + "_lovett_lyle_" + r.k.toLowerCase();
                assert(s === e);
            });
        });

        it("should create a kebab-case namespaced file name", () => {
            [
                { a: "v1", k: "ServiceAccount", l: "service-account", p: "20" },
                { a: "rbac.authorization.k8s.io/v1", k: "RoleBinding", l: "role-binding", p: "30" },
                { a: "apps/v1", k: "DaemonSet", l: "daemon-set", p: "70" },
                { a: "networking.k8s.io/v1", k: "NetworkPolicy", l: "network-policy", p: "40" },
                { a: "v1", k: "PersistentVolumeClaim", l: "persistent-volume-claim", p: "40" },
                { a: "extensions/v1beta1", k: "PodSecurityPolicy", l: "pod-security-policy", p: "40" },
                { a: "policy/v1beta1", k: "HorizontalPodAutoscaler", l: "horizontal-pod-autoscaler", p: "80" },
                { a: "policy/v1beta1", k: "PodDisruptionBudget", l: "pod-disruption-budget", p: "80" },
            ].forEach(r => {
                const o = {
                    apiVersion: r.a,
                    kind: r.k,
                    metadata: {
                        name: "lyle",
                        namespace: "lovett",
                    },
                };
                const s = kubernetesSpecFileBasename(o);
                const e = r.p + "_lovett_lyle_" + r.l;
                assert(s === e);
            });
        });

        it("should create a kebab-case cluster file name", () => {
            [
                { a: "v1", k: "PersistentVolume", l: "persistent-volume", p: "15" },
                { a: "storage.k8s.io/v1", k: "StorageClass", l: "storage-class", p: "15" },
                { a: "rbac.authorization.k8s.io/v1", k: "ClusterRole", l: "cluster-role", p: "25" },
                { a: "rbac.authorization.k8s.io/v1", k: "ClusterRoleBinding", l: "cluster-role-binding", p: "30" },
            ].forEach(r => {
                const o = {
                    apiVersion: r.a,
                    kind: r.k,
                    metadata: {
                        name: "lyle",
                    },
                };
                const s = kubernetesSpecFileBasename(o);
                const e = r.p + "_lyle_" + r.l;
                assert(s === e);
            });
        });

    });

    describe("kubernetesSpecStringify", () => {

        it("should stringify a spec", async () => {
            const r = {
                apiVersion: "v1",
                kind: "Service",
                metadata: {
                    name: "kubernetes",
                    namespace: "default",
                    labels: {
                        component: "apiserver",
                        provider: "kubernetes",
                    },
                },
                spec: {
                    type: "ClusterIP",
                    ports: [
                        {
                            name: "https",
                            protocol: "TCP",
                            port: 443,
                            targetPort: 8443,
                        },
                    ],
                    sessionAffinity: "None",
                    clusterIP: "10.96.0.1",
                },
            };
            const s = await kubernetesSpecStringify(r);
            const e = `{
  "apiVersion": "v1",
  "kind": "Service",
  "metadata": {
    "labels": {
      "component": "apiserver",
      "provider": "kubernetes"
    },
    "name": "kubernetes",
    "namespace": "default"
  },
  "spec": {
    "clusterIP": "10.96.0.1",
    "ports": [
      {
        "name": "https",
        "port": 443,
        "protocol": "TCP",
        "targetPort": 8443
      }
    ],
    "sessionAffinity": "None",
    "type": "ClusterIP"
  }
}
`;
            assert(s === e);
        });

        it("should stringify a spec to yaml", async () => {
            const r = {
                apiVersion: "v1",
                kind: "Service",
                metadata: {
                    name: "kubernetes",
                    namespace: "default",
                    labels: {
                        component: "apiserver",
                        provider: "kubernetes",
                    },
                },
                spec: {
                    type: "ClusterIP",
                    ports: [
                        {
                            name: "https",
                            protocol: "TCP",
                            port: 443,
                            targetPort: 8443,
                        },
                    ],
                    sessionAffinity: "None",
                    clusterIP: "10.96.0.1",
                },
            };
            const s = await kubernetesSpecStringify(r, { format: "yaml" });
            const e = `apiVersion: v1
kind: Service
metadata:
  labels:
    component: apiserver
    provider: kubernetes
  name: kubernetes
  namespace: default
spec:
  clusterIP: 10.96.0.1
  ports:
    - name: https
      port: 443
      protocol: TCP
      targetPort: 8443
  sessionAffinity: None
  type: ClusterIP
`;
            assert(s === e);
        });

        it("should encrypt secret values", async () => {
            const r = {
                apiVersion: "v1",
                kind: "Secret",
                type: "Opaque",
                metadata: {
                    name: "butterfly",
                    namespace: "the-hollies",
                },
                data: {
                    year: "MTk2Nw==",
                    studio: "QWJiZXkgUm9hZCBTdHVkaW9z",
                    producer: "Um9uIFJpY2hhcmRz",
                },
            };
            const k = "Dear Eloise / King Midas in Reverse";
            const s = await kubernetesSpecStringify(r, { secretKey: k });
            const e = `{
  "apiVersion": "v1",
  "data": {
    "producer": "fIXYFs7jyC5iLxbeC3iGuYdgMhA/hxHaX80SocbXKX4=",
    "studio": "CC4ZtaHs9d3f5uZ9FoTAuLGel2mTG+Wmj6iOdssUoi4=",
    "year": "gqOPJs0mmn7vj7PMjQl7Hg=="
  },
  "kind": "Secret",
  "metadata": {
    "name": "butterfly",
    "namespace": "the-hollies"
  },
  "type": "Opaque"
}
`;
            assert(s === e);
        });

    });

    describe("parseKubernetesSpecs", () => {

        it("should parse JSON", async () => {
            const c = `{
  "apiVersion": "v1",
  "kind": "Service",
  "metadata": {
    "name": "satisfied-mind",
    "namespace": "the-byrds"
  },
  "spec": {
    "ports": [
      {
        "port": 80
      }
    ],
    "selector": {
      "app.kubernetes.io/name": "satisfied-mind"
    }
  }
}
`;
            const s = parseKubernetesSpecs(c);
            const e = [{
                apiVersion: "v1",
                kind: "Service",
                metadata: {
                    name: "satisfied-mind",
                    namespace: "the-byrds",
                },
                spec: {
                    ports: [
                        {
                            port: 80,
                        },
                    ],
                    selector: {
                        "app.kubernetes.io/name": "satisfied-mind",
                    },
                },
            }];
            assert.deepStrictEqual(s, e);
        });

        it("should parse YAML", async () => {
            const c = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: turn-turn-turn
  namespace: the-byrds
spec:
  template:
    spec:
      serviceAccountName: sdm-serviceaccount
      terminationGracePeriodSeconds: 180
`;
            const s = parseKubernetesSpecs(c);
            const e = [{
                apiVersion: "apps/v1",
                kind: "Deployment",
                metadata: {
                    name: "turn-turn-turn",
                    namespace: "the-byrds",
                },
                spec: {
                    template: {
                        spec: {
                            serviceAccountName: "sdm-serviceaccount",
                            terminationGracePeriodSeconds: 180,
                        },
                    },
                },
            }];
            assert.deepStrictEqual(s, e);
        });

        it("should parse empty YAML and return nothing", async () => {
            [undefined, "", "    ", "\n"].forEach(c => {
                const s = parseKubernetesSpecs(c);
                assert.deepStrictEqual(s, []);
            });
        });

        it("should filter out non-specs", async () => {
            [
                "",
                "{}",
                `{"apiVersion":"v1"}`,
                `{"kind":"Secret"}`,
                `{"metadata":{"name":"niteclub"}}`,
                `{"apiVersion":"v1","kind":"Secret"}`,
                `{"kind":"Secret","metadata":{"name":"niteclub"}}`,
                `{"apiVersion":"v1","kind":"Secret","metadata":{"namespace":"old97s"}}`,
            ].forEach(c => {
                const s = parseKubernetesSpecs(c);
                assert.deepStrictEqual(s, []);
            });
        });

        it("should parse multiple YAML documents", async () => {
            const c = `apiVersion: v1
kind: Namespace
metadata:
  name: cert-manager
  labels:
    certmanager.k8s.io/disable-validation: "true"

---
---
# Source: cert-manager/charts/cainjector/templates/serviceaccount.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: cert-manager-cainjector
  namespace: "cert-manager"
  labels:
    app: cainjector
    app.kubernetes.io/name: cainjector
    app.kubernetes.io/instance:  cert-manager
    app.kubernetes.io/managed-by: Tiller
    helm.sh/chart: cainjector-v0.9.1

---
# Source: cert-manager/charts/webhook/templates/serviceaccount.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: cert-manager-webhook
  namespace: "cert-manager"
  labels:
    app: webhook
    app.kubernetes.io/name: webhook
    app.kubernetes.io/instance:  cert-manager
    app.kubernetes.io/managed-by: Tiller
    helm.sh/chart: webhook-v0.9.1

---
# Source: cert-manager/templates/serviceaccount.yaml
apiVersion: v1
kind: ServiceAccount
metadata:
  name: cert-manager
  namespace: "cert-manager"
  labels:
    app: cert-manager
    app.kubernetes.io/name: cert-manager
    app.kubernetes.io/instance:  cert-manager
    app.kubernetes.io/managed-by: Tiller
    helm.sh/chart: cert-manager-v0.9.1

---

`;
            const s = parseKubernetesSpecs(c);
            const e = [
                {
                    apiVersion: "v1",
                    kind: "Namespace",
                    metadata: {
                        name: "cert-manager",
                        labels: {
                            "certmanager.k8s.io/disable-validation": "true",
                        },
                    },
                },
                {
                    apiVersion: "v1",
                    kind: "ServiceAccount",
                    metadata: {
                        name: "cert-manager-cainjector",
                        namespace: "cert-manager",
                        labels: {
                            "app": "cainjector",
                            "app.kubernetes.io/name": "cainjector",
                            "app.kubernetes.io/instance": "cert-manager",
                            "app.kubernetes.io/managed-by": "Tiller",
                            "helm.sh/chart": "cainjector-v0.9.1",
                        },
                    },
                },
                {
                    apiVersion: "v1",
                    kind: "ServiceAccount",
                    metadata: {
                        name: "cert-manager-webhook",
                        namespace: "cert-manager",
                        labels: {
                            "app": "webhook",
                            "app.kubernetes.io/name": "webhook",
                            "app.kubernetes.io/instance": "cert-manager",
                            "app.kubernetes.io/managed-by": "Tiller",
                            "helm.sh/chart": "webhook-v0.9.1",
                        },
                    },
                },
                {
                    apiVersion: "v1",
                    kind: "ServiceAccount",
                    metadata: {
                        name: "cert-manager",
                        namespace: "cert-manager",
                        labels: {
                            "app": "cert-manager",
                            "app.kubernetes.io/name": "cert-manager",
                            "app.kubernetes.io/instance": "cert-manager",
                            "app.kubernetes.io/managed-by": "Tiller",
                            "helm.sh/chart": "cert-manager-v0.9.1",
                        },
                    },
                },
            ];
            assert.deepStrictEqual(s, e);
        });

    });

    describe("specSlug", () => {

        it("should return a namespaced slug", () => {
            const s = {
                apiVersion: "v1",
                kind: "Service",
                metadata: {
                    name: "mermaid",
                    namespace: "avenue",
                },
            };
            const l = specSlug(s);
            const e = "v1/avenue/services/mermaid";
            assert(l === e);
        });

        it("should return pluralize properly", () => {
            const s = {
                apiVersion: "networking.k8s.io/v1beta1",
                kind: "Ingress",
                metadata: {
                    name: "mermaid",
                    namespace: "avenue",
                },
            };
            const l = specSlug(s);
            const e = "networking.k8s.io/v1beta1/avenue/ingresses/mermaid";
            assert(l === e);
        });

        it("should return a cluster slug", () => {
            const s = {
                apiVersion: "policy/v1beta1",
                kind: "PodSecurityPolicy",
                metadata: {
                    name: "mermaid",
                },
            };
            const l = specSlug(s);
            const e = "policy/v1beta1/podsecuritypolicies/mermaid";
            assert(l === e);
        });

    });

    describe("specSnippet", () => {

        it("should return the full string", () => {
            const s = {
                apiVersion: "v1",
                kind: "Service",
                metadata: {
                    name: "mermaid",
                    namespace: "avenue",
                },
            };
            const l = specSnippet(s);
            const e = `{"apiVersion":"v1","kind":"Service","metadata":{"name":"mermaid","namespace":"avenue"}}`;
            assert(l === e);
        });

        it("should truncate the spec string", () => {
            const s = {
                apiVersion: "v1",
                kind: "Service",
                metadata: {
                    labels: {
                        component: "apiserver",
                        provider: "kubernetes",
                    },
                    name: "kubernetes",
                    namespace: "default",
                    resourceVersion: "37",
                    selfLink: "/api/v1/namespaces/default/services/kubernetes",
                    uid: "e68c82ed-111d-11ea-980a-080027477353",
                },
                spec: {
                    clusterIP: "10.96.0.1",
                    ports: [
                        {
                            name: "https",
                            port: 443,
                            protocol: "TCP",
                            targetPort: 8443,
                        },
                    ],
                    sessionAffinity: "None",
                    type: "ClusterIP",
                },
                status: {
                    loadBalancer: {},
                },
            };
            const l = specSnippet(s);
            // tslint:disable-next-line:max-line-length
            const e = `{"apiVersion":"v1","kind":"Service","metadata":{"labels":{"component":"apiserver","provider":"kubernetes"},"name":"kubernetes","namespace":"default","resourceVersion":"37","selfLink":"/api/v1/name...}`;
            assert(l === e);
        });

    });

    describe("specSnippet", () => {

        it("should return the full string", () => {
            const s = `{"apiVersion":"v1","kind":"Service","metadata":{"name":"mermaid","namespace":"avenue"}}`;
            const l = specStringSnippet(s);
            assert(l === s);
        });

        it("should truncate the string", () => {
            /* tslint:disable:max-line-length */
            const s = `{"apiVersion":"v1","kind":"Service","metadata":{"labels":{"component":"apiserver","provider":"kubernetes"},"name":"kubernetes","namespace":"default","resourceVersion":"37","selfLink":"/api/v1/nameces/default/services/kubernetes","uid":"e68c82ed-111d-11ea-980a-080027477353"},"spec":{"clusterIP":"10.96.0.1","ports":[{"name":"https","port":443,"protocol":"TCP","targetPort":8443}],"sessionAffinity":"None","type":"ClusterIP"},"status":{"loadBalancer":{}}}`;
            const l = specStringSnippet(s);
            const e = `{"apiVersion":"v1","kind":"Service","metadata":{"labels":{"component":"apiserver","provider":"kubernetes"},"name":"kubernetes","namespace":"default","resourceVersion":"37","selfLink":"/api/v1/name...}`;
            /* tslint:enable:max-line-length */
            assert(l === e);
        });

    });

});
