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
import * as _ from "lodash";
import * as assert from "power-assert";
import {
    cleanKubernetesSpec,
    clusterResourceKinds,
    defaultKubernetesFetchOptions,
    defaultKubernetesResourceSelectorKinds,
    filterMatch,
    includedResourceKinds,
    kindMatch,
    kubernetesFetch,
    kubernetesResourceIdentity,
    KubernetesResourceSelector,
    namespaceResourceKinds,
    populateResourceSelectorDefaults,
    selectKubernetesResources,
    selectorMatch,
} from "../../../../../lib/core/pack/k8s/kubernetes/fetch";
import {
    afterRetry,
    beforeRetry,
    k8sAvailable,
} from "../k8s";

/* tslint:disable:max-file-line-count */

describe("pack/k8s/kubernetes/fetch", () => {

    const client: any = {
        resource: async (apiVersion: string, kind: string): Promise<k8s.V1APIResource | undefined> => {
            const clusterResources = [
                "APIService",
                "AuditSink",
                "CertificateSigningRequest",
                "ClusterCustomObject",
                "ClusterRole",
                "ClusterRoleBinding",
                "CustomResourceDefinition",
                "InitializerConfiguration",
                "MutatingWebhookConfiguration",
                "Namespace",
                "Node",
                "PersistentVolume",
                "PodSecurityPolicy",
                "PriorityClass",
                "SelfSubjectAccessReview",
                "SelfSubjectRulesReview",
                "StorageClass",
                "SubjectAccessReview",
                "TokenReview",
                "ValidatingWebhookConfiguration",
                "VolumeAttachment",
                "APIServiceStatus",
                "CertificateSigningRequestStatus",
                "CustomResourceDefinitionStatus",
                "NamespaceStatus",
                "NodeStatus",
                "PersistentVolumeStatus",
                "VolumeAttachmentStatus",
            ];
            const name = kind.toLowerCase().replace(/s$/, "se").replace(/y$/, "ie") + "s";
            const namespaced = !clusterResources.includes(kind);
            const apiResource: any = { name, namespaced };
            return apiResource;
        },
    };

    describe("populateResourceSelectorDefaults", () => {

        it("should do nothing successfully", () => {
            const p = populateResourceSelectorDefaults([]);
            assert.deepStrictEqual(p, []);
        });

        it("should populate an empty object", () => {
            const s = [{}];
            const p = populateResourceSelectorDefaults(s);
            const e = [
                {
                    action: "include",
                    kinds: [
                        { apiVersion: "v1", kind: "ConfigMap" },
                        { apiVersion: "v1", kind: "Namespace" },
                        { apiVersion: "v1", kind: "Secret" },
                        { apiVersion: "v1", kind: "Service" },
                        { apiVersion: "v1", kind: "ServiceAccount" },
                        { apiVersion: "v1", kind: "PersistentVolume" },
                        { apiVersion: "v1", kind: "PersistentVolumeClaim" },
                        { apiVersion: "apps/v1", kind: "DaemonSet" },
                        { apiVersion: "apps/v1", kind: "Deployment" },
                        { apiVersion: "apps/v1", kind: "StatefulSet" },
                        { apiVersion: "autoscaling/v1", kind: "HorizontalPodAutoscaler" },
                        { apiVersion: "batch/v1beta1", kind: "CronJob" },
                        { apiVersion: "extensions/v1beta1", kind: "Ingress" },
                        { apiVersion: "networking.k8s.io/v1", kind: "NetworkPolicy" },
                        { apiVersion: "policy/v1beta1", kind: "PodDisruptionBudget" },
                        { apiVersion: "policy/v1beta1", kind: "PodSecurityPolicy" },
                        { apiVersion: "rbac.authorization.k8s.io/v1", kind: "ClusterRole" },
                        { apiVersion: "rbac.authorization.k8s.io/v1", kind: "ClusterRoleBinding" },
                        { apiVersion: "rbac.authorization.k8s.io/v1", kind: "Role" },
                        { apiVersion: "rbac.authorization.k8s.io/v1", kind: "RoleBinding" },
                        { apiVersion: "storage.k8s.io/v1", kind: "StorageClass" },
                    ],
                },
            ];
            assert.deepStrictEqual(p, e);
        });

        it("should not populate kinds for exclude", () => {
            const s: KubernetesResourceSelector[] = [{ action: "exclude", namespace: /^kube-/ }];
            const p = populateResourceSelectorDefaults(s);
            const e = [{ action: "exclude", namespace: /^kube-/ }];
            assert.deepStrictEqual(p, e);
        });

        it("should keep the provided kinds", () => {
            const s: KubernetesResourceSelector[] = [
                { kinds: [{ apiVersion: "networking.k8s.io/v1", kind: "NetworkPolicy" }] },
            ];
            const p = populateResourceSelectorDefaults(s);
            const e = [
                {
                    action: "include",
                    kinds: [
                        { apiVersion: "networking.k8s.io/v1", kind: "NetworkPolicy" },
                    ],
                },
            ];
            assert.deepStrictEqual(p, e);
        });

        it("should not add defaults if values already present", () => {
            const s: KubernetesResourceSelector[] = [
                {
                    action: "exclude",
                    kinds: [
                        { apiVersion: "v1", kind: "Secret" },
                        { apiVersion: "v1", kind: "Service" },
                        { apiVersion: "apps/v1", kind: "Deployment" },
                    ],
                },
            ];
            const p = populateResourceSelectorDefaults(s);
            const e = [
                {
                    action: "exclude",
                    kinds: [
                        { apiVersion: "v1", kind: "Secret" },
                        { apiVersion: "v1", kind: "Service" },
                        { apiVersion: "apps/v1", kind: "Deployment" },
                    ],
                },
            ];
            assert.deepStrictEqual(p, e);
        });

        it("should process multiple selectors", () => {
            const s: KubernetesResourceSelector[] = [
                {},
                { kinds: [{ apiVersion: "networking.k8s.io/v1", kind: "NetworkPolicy" }] },
                { action: "exclude", namespace: "kube-system" },
                {
                    action: "exclude",
                    kinds: [
                        { apiVersion: "v1", kind: "Secret" },
                        { apiVersion: "v1", kind: "Service" },
                        { apiVersion: "apps/v1", kind: "Deployment" },
                    ],
                },
            ];
            const p = populateResourceSelectorDefaults(s);
            const e = [
                {
                    action: "include",
                    kinds: [
                        { apiVersion: "v1", kind: "ConfigMap" },
                        { apiVersion: "v1", kind: "Namespace" },
                        { apiVersion: "v1", kind: "Secret" },
                        { apiVersion: "v1", kind: "Service" },
                        { apiVersion: "v1", kind: "ServiceAccount" },
                        { apiVersion: "v1", kind: "PersistentVolume" },
                        { apiVersion: "v1", kind: "PersistentVolumeClaim" },
                        { apiVersion: "apps/v1", kind: "DaemonSet" },
                        { apiVersion: "apps/v1", kind: "Deployment" },
                        { apiVersion: "apps/v1", kind: "StatefulSet" },
                        { apiVersion: "autoscaling/v1", kind: "HorizontalPodAutoscaler" },
                        { apiVersion: "batch/v1beta1", kind: "CronJob" },
                        { apiVersion: "extensions/v1beta1", kind: "Ingress" },
                        { apiVersion: "networking.k8s.io/v1", kind: "NetworkPolicy" },
                        { apiVersion: "policy/v1beta1", kind: "PodDisruptionBudget" },
                        { apiVersion: "policy/v1beta1", kind: "PodSecurityPolicy" },
                        { apiVersion: "rbac.authorization.k8s.io/v1", kind: "ClusterRole" },
                        { apiVersion: "rbac.authorization.k8s.io/v1", kind: "ClusterRoleBinding" },
                        { apiVersion: "rbac.authorization.k8s.io/v1", kind: "Role" },
                        { apiVersion: "rbac.authorization.k8s.io/v1", kind: "RoleBinding" },
                        { apiVersion: "storage.k8s.io/v1", kind: "StorageClass" },
                    ],
                },
                {
                    action: "include",
                    kinds: [{ apiVersion: "networking.k8s.io/v1", kind: "NetworkPolicy" }],
                },
                {
                    action: "exclude",
                    namespace: "kube-system",
                },
                {
                    action: "exclude",
                    kinds: [
                        { apiVersion: "v1", kind: "Secret" },
                        { apiVersion: "v1", kind: "Service" },
                        { apiVersion: "apps/v1", kind: "Deployment" },
                    ],
                },
            ];
            assert.deepStrictEqual(p, e);
        });

        it("should remove empty exclusion selectors", () => {
            const f = () => true;
            const s: KubernetesResourceSelector[] = [
                { action: "exclude" },
                { kinds: [{ apiVersion: "networking.k8s.io/v1", kind: "NetworkPolicy" }] },
                { action: "exclude", namespace: "kube-system" },
                { action: "exclude" },
                {
                    action: "exclude",
                    kinds: [
                        { apiVersion: "v1", kind: "Secret" },
                        { apiVersion: "v1", kind: "Service" },
                        { apiVersion: "apps/v1", kind: "Deployment" },
                    ],
                },
                { action: "exclude", filter: f },
                { action: "exclude" },
            ];
            const p = populateResourceSelectorDefaults(s);
            const e = [
                {
                    action: "include",
                    kinds: [{ apiVersion: "networking.k8s.io/v1", kind: "NetworkPolicy" }],
                },
                {
                    action: "exclude",
                    namespace: "kube-system",
                },
                {
                    action: "exclude",
                    kinds: [
                        { apiVersion: "v1", kind: "Secret" },
                        { apiVersion: "v1", kind: "Service" },
                        { apiVersion: "apps/v1", kind: "Deployment" },
                    ],
                },
                { action: "exclude", filter: f },
            ];
            assert.deepStrictEqual(p, e);
        });

    });

    describe("includedResourceKinds", () => {

        it("should find nothing successfully", () => {
            const s = includedResourceKinds([]);
            assert.deepStrictEqual(s, []);
        });

        it("should return included resource kinds", () => {
            const s: KubernetesResourceSelector[] = [
                {
                    action: "include",
                    kinds: [
                        { apiVersion: "v1", kind: "ConfigMap" },
                        { apiVersion: "v1", kind: "Secret" },
                        { apiVersion: "v1", kind: "Service" },
                        { apiVersion: "v1", kind: "ServiceAccount" },
                    ],
                },
                {
                    action: "include",
                    kinds: [
                        { apiVersion: "v1", kind: "PersistentVolumeClaim" },
                        { apiVersion: "apps/v1", kind: "DaemonSet" },
                        { apiVersion: "apps/v1", kind: "Deployment" },
                        { apiVersion: "apps/v1", kind: "StatefulSet" },
                        { apiVersion: "extensions/v1beta1", kind: "Ingress" },
                    ],
                },
                {
                    action: "include",
                    kinds: [
                        { apiVersion: "autoscaling/v1", kind: "HorizontalPodAutoscaler" },
                        { apiVersion: "batch/v1beta1", kind: "CronJob" },
                        { apiVersion: "networking.k8s.io/v1", kind: "NetworkPolicy" },
                        { apiVersion: "rbac.authorization.k8s.io/v1", kind: "Role" },
                        { apiVersion: "rbac.authorization.k8s.io/v1", kind: "RoleBinding" },
                    ],
                },
            ];
            const c = includedResourceKinds(s);
            const e = [
                { apiVersion: "v1", kind: "ConfigMap" },
                { apiVersion: "v1", kind: "Secret" },
                { apiVersion: "v1", kind: "Service" },
                { apiVersion: "v1", kind: "ServiceAccount" },
                { apiVersion: "v1", kind: "PersistentVolumeClaim" },
                { apiVersion: "apps/v1", kind: "DaemonSet" },
                { apiVersion: "apps/v1", kind: "Deployment" },
                { apiVersion: "apps/v1", kind: "StatefulSet" },
                { apiVersion: "extensions/v1beta1", kind: "Ingress" },
                { apiVersion: "autoscaling/v1", kind: "HorizontalPodAutoscaler" },
                { apiVersion: "batch/v1beta1", kind: "CronJob" },
                { apiVersion: "networking.k8s.io/v1", kind: "NetworkPolicy" },
                { apiVersion: "rbac.authorization.k8s.io/v1", kind: "Role" },
                { apiVersion: "rbac.authorization.k8s.io/v1", kind: "RoleBinding" },
            ];
            assert.deepStrictEqual(c, e);
        });

        it("should return included resource kinds and dedupe", () => {
            const s: KubernetesResourceSelector[] = [
                {
                    action: "include",
                    kinds: [
                        { apiVersion: "v1", kind: "ConfigMap" },
                        { apiVersion: "v1", kind: "Secret" },
                        { apiVersion: "v1", kind: "Service" },
                        { apiVersion: "v1", kind: "ServiceAccount" },
                    ],
                },
                {
                    action: "include",
                    kinds: [
                        { apiVersion: "v1", kind: "PersistentVolumeClaim" },
                        { apiVersion: "apps/v1", kind: "DaemonSet" },
                        { apiVersion: "apps/v1", kind: "Deployment" },
                        { apiVersion: "apps/v1", kind: "StatefulSet" },
                        { apiVersion: "extensions/v1beta1", kind: "Ingress" },
                    ],
                },
                {
                    action: "include",
                    kinds: [
                        { apiVersion: "autoscaling/v1", kind: "HorizontalPodAutoscaler" },
                        { apiVersion: "batch/v1beta1", kind: "CronJob" },
                        { apiVersion: "networking.k8s.io/v1", kind: "NetworkPolicy" },
                        { apiVersion: "rbac.authorization.k8s.io/v1", kind: "Role" },
                        { apiVersion: "rbac.authorization.k8s.io/v1", kind: "RoleBinding" },
                    ],
                },
                {
                    action: "include",
                    kinds: [
                        { apiVersion: "v1", kind: "Service" },
                        { apiVersion: "v1", kind: "ServiceAccount" },
                    ],
                },
            ];
            const c = includedResourceKinds(s);
            const e = [
                { apiVersion: "v1", kind: "ConfigMap" },
                { apiVersion: "v1", kind: "Secret" },
                { apiVersion: "v1", kind: "Service" },
                { apiVersion: "v1", kind: "ServiceAccount" },
                { apiVersion: "v1", kind: "PersistentVolumeClaim" },
                { apiVersion: "apps/v1", kind: "DaemonSet" },
                { apiVersion: "apps/v1", kind: "Deployment" },
                { apiVersion: "apps/v1", kind: "StatefulSet" },
                { apiVersion: "extensions/v1beta1", kind: "Ingress" },
                { apiVersion: "autoscaling/v1", kind: "HorizontalPodAutoscaler" },
                { apiVersion: "batch/v1beta1", kind: "CronJob" },
                { apiVersion: "networking.k8s.io/v1", kind: "NetworkPolicy" },
                { apiVersion: "rbac.authorization.k8s.io/v1", kind: "Role" },
                { apiVersion: "rbac.authorization.k8s.io/v1", kind: "RoleBinding" },
            ];
            assert.deepStrictEqual(c, e);
        });

        it("should not include excluded resource kinds", () => {
            const s: KubernetesResourceSelector[] = [
                {
                    action: "exclude",
                    kinds: [
                        { apiVersion: "v1", kind: "ConfigMap" },
                        { apiVersion: "v1", kind: "Secret" },
                        { apiVersion: "v1", kind: "Service" },
                        { apiVersion: "v1", kind: "ServiceAccount" },
                    ],
                },
                {
                    action: "exclude",
                    kinds: [
                        { apiVersion: "v1", kind: "PersistentVolumeClaim" },
                        { apiVersion: "apps/v1", kind: "DaemonSet" },
                        { apiVersion: "apps/v1", kind: "Deployment" },
                        { apiVersion: "apps/v1", kind: "StatefulSet" },
                        { apiVersion: "extensions/v1beta1", kind: "Ingress" },
                    ],
                },
                {
                    action: "exclude",
                    kinds: [
                        { apiVersion: "autoscaling/v1", kind: "HorizontalPodAutoscaler" },
                        { apiVersion: "batch/v1beta1", kind: "CronJob" },
                        { apiVersion: "networking.k8s.io/v1", kind: "NetworkPolicy" },
                        { apiVersion: "rbac.authorization.k8s.io/v1", kind: "Role" },
                        { apiVersion: "rbac.authorization.k8s.io/v1", kind: "RoleBinding" },
                    ],
                },
            ];
            const c = includedResourceKinds(s);
            assert.deepStrictEqual(c, []);
        });

        it("should return only included resource kinds and dedupe", () => {
            const s: KubernetesResourceSelector[] = [
                {
                    action: "include",
                    kinds: [
                        { apiVersion: "v1", kind: "ConfigMap" },
                        { apiVersion: "v1", kind: "Secret" },
                        { apiVersion: "v1", kind: "Service" },
                        { apiVersion: "v1", kind: "ServiceAccount" },
                    ],
                },
                {
                    action: "exclude",
                    kinds: [
                        { apiVersion: "v1", kind: "PersistentVolumeClaim" },
                        { apiVersion: "apps/v1", kind: "DaemonSet" },
                        { apiVersion: "apps/v1", kind: "Deployment" },
                        { apiVersion: "apps/v1", kind: "StatefulSet" },
                        { apiVersion: "extensions/v1beta1", kind: "Ingress" },
                    ],
                },
                {
                    action: "include",
                    kinds: [
                        { apiVersion: "v1", kind: "PersistentVolume" },
                        { apiVersion: "policy/v1beta1", kind: "PodSecurityPolicy" },
                        { apiVersion: "rbac.authorization.k8s.io/v1", kind: "ClusterRole" },
                        { apiVersion: "rbac.authorization.k8s.io/v1", kind: "ClusterRoleBinding" },
                        { apiVersion: "storage.k8s.io/v1", kind: "StorageClass" },
                    ],
                },
                {
                    action: "include",
                    kinds: [
                        { apiVersion: "autoscaling/v1", kind: "HorizontalPodAutoscaler" },
                        { apiVersion: "batch/v1beta1", kind: "CronJob" },
                        { apiVersion: "networking.k8s.io/v1", kind: "NetworkPolicy" },
                        { apiVersion: "rbac.authorization.k8s.io/v1", kind: "Role" },
                        { apiVersion: "rbac.authorization.k8s.io/v1", kind: "RoleBinding" },
                    ],
                },
                {
                    action: "exclude",
                    kinds: [
                        { apiVersion: "v1", kind: "PersistentVolume" },
                        { apiVersion: "policy/v1beta1", kind: "PodSecurityPolicy" },
                        { apiVersion: "rbac.authorization.k8s.io/v1", kind: "ClusterRole" },
                    ],
                },
                {
                    action: "include",
                    kinds: [
                        { apiVersion: "v1", kind: "Service" },
                        { apiVersion: "v1", kind: "ServiceAccount" },
                    ],
                },
                {
                    action: "include",
                    kinds: [
                        { apiVersion: "rbac.authorization.k8s.io/v1", kind: "ClusterRole" },
                        { apiVersion: "rbac.authorization.k8s.io/v1", kind: "ClusterRoleBinding" },
                        { apiVersion: "storage.k8s.io/v1", kind: "StorageClass" },
                    ],
                },
            ];
            const c = includedResourceKinds(s);
            const e = [
                { apiVersion: "v1", kind: "ConfigMap" },
                { apiVersion: "v1", kind: "Secret" },
                { apiVersion: "v1", kind: "Service" },
                { apiVersion: "v1", kind: "ServiceAccount" },
                { apiVersion: "v1", kind: "PersistentVolume" },
                { apiVersion: "policy/v1beta1", kind: "PodSecurityPolicy" },
                { apiVersion: "rbac.authorization.k8s.io/v1", kind: "ClusterRole" },
                { apiVersion: "rbac.authorization.k8s.io/v1", kind: "ClusterRoleBinding" },
                { apiVersion: "storage.k8s.io/v1", kind: "StorageClass" },
                { apiVersion: "autoscaling/v1", kind: "HorizontalPodAutoscaler" },
                { apiVersion: "batch/v1beta1", kind: "CronJob" },
                { apiVersion: "networking.k8s.io/v1", kind: "NetworkPolicy" },
                { apiVersion: "rbac.authorization.k8s.io/v1", kind: "Role" },
                { apiVersion: "rbac.authorization.k8s.io/v1", kind: "RoleBinding" },
            ];
            assert.deepStrictEqual(c, e);
        });

    });

    describe("clusterResourceKinds", () => {

        it("should return empty array if no cluster resources", async () => {
            const s: KubernetesResourceSelector[] = [
                {
                    action: "include",
                    kinds: [
                        { apiVersion: "v1", kind: "ConfigMap" },
                        { apiVersion: "v1", kind: "Secret" },
                        { apiVersion: "v1", kind: "Service" },
                        { apiVersion: "v1", kind: "ServiceAccount" },
                    ],
                },
                {
                    action: "include",
                    kinds: [
                        { apiVersion: "v1", kind: "PersistentVolumeClaim" },
                        { apiVersion: "apps/v1", kind: "DaemonSet" },
                        { apiVersion: "apps/v1", kind: "Deployment" },
                        { apiVersion: "apps/v1", kind: "StatefulSet" },
                        { apiVersion: "extensions/v1beta1", kind: "Ingress" },
                    ],
                },
                {
                    action: "include",
                    kinds: [
                        { apiVersion: "autoscaling/v1", kind: "HorizontalPodAutoscaler" },
                        { apiVersion: "batch/v1beta1", kind: "CronJob" },
                        { apiVersion: "networking.k8s.io/v1", kind: "NetworkPolicy" },
                        { apiVersion: "rbac.authorization.k8s.io/v1", kind: "Role" },
                        { apiVersion: "rbac.authorization.k8s.io/v1", kind: "RoleBinding" },
                    ],
                },
                {
                    action: "include",
                    kinds: [
                        { apiVersion: "v1", kind: "Service" },
                        { apiVersion: "v1", kind: "ServiceAccount" },
                    ],
                },
            ];
            const c = await clusterResourceKinds(s, client);
            assert.deepStrictEqual(c, []);
        });

        it("should return cluster resources from default", async () => {
            const s: KubernetesResourceSelector[] = [{ action: "include", kinds: defaultKubernetesResourceSelectorKinds }];
            const c = await clusterResourceKinds(s, client);
            const e = [
                { apiVersion: "v1", kind: "Namespace" },
                { apiVersion: "v1", kind: "PersistentVolume" },
                { apiVersion: "policy/v1beta1", kind: "PodSecurityPolicy" },
                { apiVersion: "rbac.authorization.k8s.io/v1", kind: "ClusterRole" },
                { apiVersion: "rbac.authorization.k8s.io/v1", kind: "ClusterRoleBinding" },
                { apiVersion: "storage.k8s.io/v1", kind: "StorageClass" },
            ];
            assert.deepStrictEqual(c, e);
        });

        it("should deduplicate cluster resources", async () => {
            const s: KubernetesResourceSelector[] = [
                { action: "include", kinds: defaultKubernetesResourceSelectorKinds },
                { action: "include", kinds: defaultKubernetesResourceSelectorKinds },
                { action: "include", kinds: defaultKubernetesResourceSelectorKinds },
            ];
            const c = await clusterResourceKinds(s, client);
            const e = [
                { apiVersion: "v1", kind: "Namespace" },
                { apiVersion: "v1", kind: "PersistentVolume" },
                { apiVersion: "policy/v1beta1", kind: "PodSecurityPolicy" },
                { apiVersion: "rbac.authorization.k8s.io/v1", kind: "ClusterRole" },
                { apiVersion: "rbac.authorization.k8s.io/v1", kind: "ClusterRoleBinding" },
                { apiVersion: "storage.k8s.io/v1", kind: "StorageClass" },
            ];
            assert.deepStrictEqual(c, e);
        });

        it("should return nothing from exclude", async () => {
            const s: KubernetesResourceSelector[] = [{ action: "exclude", kinds: defaultKubernetesResourceSelectorKinds }];
            const c = await clusterResourceKinds(s, client);
            assert.deepStrictEqual(c, []);
        });

    });

    describe("namespaceResourceKinds", async () => {

        it("should find nothing successfully", async () => {
            const n = "son-house";
            const s = await namespaceResourceKinds(n, [], client);
            assert.deepStrictEqual(s, []);
        });

        it("should return include resource kinds with no namespace selector", async () => {
            const n = "son-house";
            const s: KubernetesResourceSelector[] = [
                {
                    action: "include",
                    kinds: [
                        { apiVersion: "v1", kind: "ConfigMap" },
                        { apiVersion: "v1", kind: "Secret" },
                        { apiVersion: "v1", kind: "Service" },
                        { apiVersion: "v1", kind: "ServiceAccount" },
                    ],
                },
            ];
            const c = await namespaceResourceKinds(n, s, client);
            const e = [
                { apiVersion: "v1", kind: "ConfigMap" },
                { apiVersion: "v1", kind: "Secret" },
                { apiVersion: "v1", kind: "Service" },
                { apiVersion: "v1", kind: "ServiceAccount" },
            ];
            assert.deepStrictEqual(c, e);
        });

        it("should return include resource kinds with string namespace selector", async () => {
            const n = "son-house";
            const s: KubernetesResourceSelector[] = [
                {
                    action: "include",
                    kinds: [
                        { apiVersion: "v1", kind: "ConfigMap" },
                        { apiVersion: "v1", kind: "Secret" },
                        { apiVersion: "v1", kind: "Service" },
                        { apiVersion: "v1", kind: "ServiceAccount" },
                    ],
                    namespace: "son-house",
                },
            ];
            const c = await namespaceResourceKinds(n, s, client);
            const e = [
                { apiVersion: "v1", kind: "ConfigMap" },
                { apiVersion: "v1", kind: "Secret" },
                { apiVersion: "v1", kind: "Service" },
                { apiVersion: "v1", kind: "ServiceAccount" },
            ];
            assert.deepStrictEqual(c, e);
        });

        it("should return include resource kinds with regular expression namespace selector", async () => {
            const n = "son-house";
            const s: KubernetesResourceSelector[] = [
                {
                    action: "include",
                    kinds: [
                        { apiVersion: "v1", kind: "ConfigMap" },
                        { apiVersion: "v1", kind: "Secret" },
                        { apiVersion: "v1", kind: "Service" },
                        { apiVersion: "v1", kind: "ServiceAccount" },
                    ],
                    namespace: /on-hous/,
                },
            ];
            const c = await namespaceResourceKinds(n, s, client);
            const e = [
                { apiVersion: "v1", kind: "ConfigMap" },
                { apiVersion: "v1", kind: "Secret" },
                { apiVersion: "v1", kind: "Service" },
                { apiVersion: "v1", kind: "ServiceAccount" },
            ];
            assert.deepStrictEqual(c, e);
        });

        it("should return nothing from exclude selectors", async () => {
            const n = "son-house";
            const s: KubernetesResourceSelector[] = [
                {
                    action: "exclude",
                    kinds: [
                        { apiVersion: "v1", kind: "ConfigMap" },
                        { apiVersion: "v1", kind: "Secret" },
                        { apiVersion: "v1", kind: "Service" },
                        { apiVersion: "v1", kind: "ServiceAccount" },
                    ],
                },
            ];
            const c = await namespaceResourceKinds(n, s, client);
            assert.deepStrictEqual(c, []);
        });

        it("should return included resource kinds and dedupe", async () => {
            const n = "son-house";
            const s: KubernetesResourceSelector[] = [
                {
                    action: "include",
                    kinds: [
                        { apiVersion: "v1", kind: "ConfigMap" },
                        { apiVersion: "v1", kind: "Secret" },
                        { apiVersion: "v1", kind: "Service" },
                        { apiVersion: "v1", kind: "ServiceAccount" },
                    ],
                },
                {
                    action: "include",
                    kinds: [
                        { apiVersion: "v1", kind: "PersistentVolumeClaim" },
                        { apiVersion: "apps/v1", kind: "DaemonSet" },
                        { apiVersion: "apps/v1", kind: "Deployment" },
                        { apiVersion: "apps/v1", kind: "StatefulSet" },
                        { apiVersion: "extensions/v1beta1", kind: "Ingress" },
                    ],
                    namespace: "son-house",
                },
                {
                    action: "include",
                    kinds: [
                        { apiVersion: "autoscaling/v1", kind: "HorizontalPodAutoscaler" },
                        { apiVersion: "batch/v1beta1", kind: "CronJob" },
                        { apiVersion: "networking.k8s.io/v1", kind: "NetworkPolicy" },
                        { apiVersion: "rbac.authorization.k8s.io/v1", kind: "Role" },
                        { apiVersion: "rbac.authorization.k8s.io/v1", kind: "RoleBinding" },
                    ],
                    namespace: /houses?$/,
                },
                {
                    action: "include",
                    kinds: [
                        { apiVersion: "v1", kind: "Service" },
                        { apiVersion: "v1", kind: "ServiceAccount" },
                        { apiVersion: "rbac.authorization.k8s.io/v1", kind: "RoleBinding" },
                    ],
                },
            ];
            const c = await namespaceResourceKinds(n, s, client);
            const e = [
                { apiVersion: "v1", kind: "ConfigMap" },
                { apiVersion: "v1", kind: "Secret" },
                { apiVersion: "v1", kind: "Service" },
                { apiVersion: "v1", kind: "ServiceAccount" },
                { apiVersion: "v1", kind: "PersistentVolumeClaim" },
                { apiVersion: "apps/v1", kind: "DaemonSet" },
                { apiVersion: "apps/v1", kind: "Deployment" },
                { apiVersion: "apps/v1", kind: "StatefulSet" },
                { apiVersion: "extensions/v1beta1", kind: "Ingress" },
                { apiVersion: "autoscaling/v1", kind: "HorizontalPodAutoscaler" },
                { apiVersion: "batch/v1beta1", kind: "CronJob" },
                { apiVersion: "networking.k8s.io/v1", kind: "NetworkPolicy" },
                { apiVersion: "rbac.authorization.k8s.io/v1", kind: "Role" },
                { apiVersion: "rbac.authorization.k8s.io/v1", kind: "RoleBinding" },
            ];
            assert.deepStrictEqual(c, e);
        });

        it("should include included that are also excluded", async () => {
            const n = "son-house";
            const s: KubernetesResourceSelector[] = [
                {
                    action: "exclude",
                    kinds: [
                        { apiVersion: "v1", kind: "ConfigMap" },
                        { apiVersion: "v1", kind: "Secret" },
                        { apiVersion: "v1", kind: "Service" },
                        { apiVersion: "v1", kind: "ServiceAccount" },
                    ],
                },
                {
                    action: "include",
                    kinds: [
                        { apiVersion: "v1", kind: "ConfigMap" },
                        { apiVersion: "v1", kind: "Secret" },
                        { apiVersion: "v1", kind: "Service" },
                        { apiVersion: "v1", kind: "ServiceAccount" },
                    ],
                    namespace: /(house|home)/,
                },
                {
                    action: "exclude",
                    kinds: [
                        { apiVersion: "v1", kind: "Secret" },
                        { apiVersion: "v1", kind: "ConfigMap" },
                        { apiVersion: "v1", kind: "Secret" },
                        { apiVersion: "v1", kind: "ServiceAccount" },
                    ],
                    namespace: "son-house",
                },
            ];
            const c = await namespaceResourceKinds(n, s, client);
            const e = [
                { apiVersion: "v1", kind: "ConfigMap" },
                { apiVersion: "v1", kind: "Secret" },
                { apiVersion: "v1", kind: "Service" },
                { apiVersion: "v1", kind: "ServiceAccount" },
            ];
            assert.deepStrictEqual(c, e);
        });

        it("should not return cluster resources", async () => {
            const n = "son-house";
            const s: KubernetesResourceSelector[] = [
                {
                    action: "include",
                    kinds: [
                        { apiVersion: "v1", kind: "PersistentVolume" },
                        { apiVersion: "policy/v1beta1", kind: "PodSecurityPolicy" },
                        { apiVersion: "rbac.authorization.k8s.io/v1", kind: "ClusterRole" },
                        { apiVersion: "rbac.authorization.k8s.io/v1", kind: "ClusterRoleBinding" },
                        { apiVersion: "storage.k8s.io/v1", kind: "StorageClass" },
                    ],
                },
            ];
            const c = await namespaceResourceKinds(n, s, client);
            assert.deepStrictEqual(c, []);
        });

    });

    describe("cleanKubernetesSpec", () => {

        it("should do nothing safely", () => {
            const c = cleanKubernetesSpec(undefined, { apiVersion: "v1", kind: "Secret" });
            assert(c === undefined);
        });

        it("should populate the apiVersion and kind", () => {
            const c = cleanKubernetesSpec({}, { apiVersion: "v1", kind: "Secret" });
            const e = { apiVersion: "v1", kind: "Secret" };
            assert.deepStrictEqual(c, e);
        });

        it("should not overwrite the apiVersion and kind", () => {
            const s = { apiVersion: "apps/v1", kind: "Deployment" };
            const c = cleanKubernetesSpec(s, { apiVersion: "v1", kind: "Secret" });
            const e = { apiVersion: "apps/v1", kind: "Deployment" };
            assert.deepStrictEqual(c, e);
        });

        it("should remove unneeded properties", () => {
            const s: any = {
                apiVersion: "extensions/v1beta1",
                kind: "Deployment",
                metadata: {
                    annotations: {
                        "atomist.sha": "ee71cfb6eb63ee0ddc8875cb211074277b543d76",
                        "deployment.kubernetes.io/revision": "2008",
                        "kubectl.kubernetes.io/last-applied-configuration": "{}",
                    },
                    creationTimestamp: "2008-09-16T09:52:09Z",
                    generation: 13,
                    labels: {
                        "app.kubernetes.io/managed-by": "columbia",
                        "app.kubernetes.io/name": "the-way-i-see-it",
                        "app.kubernetes.io/part-of": "the-way-i-see-it",
                        "atomist.com/workspaceId": "APHA31",
                    },
                    name: "the-way-i-see-it",
                    namespace: "raphael-saadiq",
                    resourceVersion: "4207",
                    selfLink: "/apis/extensions/v1beta1/namespaces/raphael-saadiq/deployments/the-way-i-see-it",
                    uid: "31c06e3f-303e-11e9-b6a6-42010af001a7",
                },
                spec: {
                    progressDeadlineSeconds: 2147483647,
                    replicas: 2,
                    revisionHistoryLimit: 3,
                    selector: {
                        matchLabels: {
                            "app.kubernetes.io/name": "the-way-i-see-it",
                            "atomist.com/workspaceId": "APHA31",
                        },
                    },
                    strategy: {
                        rollingUpdate: {
                            maxSurge: 1,
                            maxUnavailable: 0,
                        },
                        type: "RollingUpdate",
                    },
                    template: {
                        metadata: {
                            creationTimestamp: undefined,
                            labels: {
                                "app.kubernetes.io/managed-by": "columbia",
                                "app.kubernetes.io/name": "the-way-i-see-it",
                                "app.kubernetes.io/part-of": "the-way-i-see-it",
                                "atomist.com/workspaceId": "APHA31",
                            },
                        },
                        spec: {
                            containers: [{
                                image: "raphaelsaadiq/the-way-i-see-it:2008",
                                name: "the-way-i-see-it",
                            }],
                        },
                    },
                },
                status: {
                    availableReplicas: 2,
                    conditions: [
                        {
                            lastTransitionTime: "2019-06-28T21:02:49Z",
                            lastUpdateTime: "2019-06-28T21:02:49Z",
                            message: "Deployment has minimum availability.",
                            reason: "MinimumReplicasAvailable",
                            status: "True",
                            type: "Available",
                        },
                    ],
                    observedGeneration: 13,
                    readyReplicas: 2,
                    replicas: 2,
                    updatedReplicas: 2,
                },
            };
            const c = cleanKubernetesSpec(s, { apiVersion: "apps/v1", kind: "Deployment" });
            const e = {
                apiVersion: "extensions/v1beta1",
                kind: "Deployment",
                metadata: {
                    annotations: {
                        "atomist.sha": "ee71cfb6eb63ee0ddc8875cb211074277b543d76",
                    },
                    labels: {
                        "app.kubernetes.io/managed-by": "columbia",
                        "app.kubernetes.io/name": "the-way-i-see-it",
                        "app.kubernetes.io/part-of": "the-way-i-see-it",
                        "atomist.com/workspaceId": "APHA31",
                    },
                    name: "the-way-i-see-it",
                    namespace: "raphael-saadiq",
                },
                spec: {
                    progressDeadlineSeconds: 2147483647,
                    replicas: 2,
                    revisionHistoryLimit: 3,
                    selector: {
                        matchLabels: {
                            "app.kubernetes.io/name": "the-way-i-see-it",
                            "atomist.com/workspaceId": "APHA31",
                        },
                    },
                    strategy: {
                        rollingUpdate: {
                            maxSurge: 1,
                            maxUnavailable: 0,
                        },
                        type: "RollingUpdate",
                    },
                    template: {
                        metadata: {
                            labels: {
                                "app.kubernetes.io/managed-by": "columbia",
                                "app.kubernetes.io/name": "the-way-i-see-it",
                                "app.kubernetes.io/part-of": "the-way-i-see-it",
                                "atomist.com/workspaceId": "APHA31",
                            },
                        },
                        spec: {
                            containers: [{
                                image: "raphaelsaadiq/the-way-i-see-it:2008",
                                name: "the-way-i-see-it",
                            }],
                        },
                    },
                },
            };
            assert.deepStrictEqual(c, e);
        });

        it("should remove empty annotations", () => {
            const s: any = {
                metadata: {
                    annotations: {
                        "deployment.kubernetes.io/revision": "2008",
                        "kubectl.kubernetes.io/last-applied-configuration": "{}",
                    },
                    name: "the-way-i-see-it",
                    namespace: "raphael-saadiq",
                },
            };
            const c = cleanKubernetesSpec(s, { apiVersion: "v1", kind: "Secret" });
            const e = {
                apiVersion: "v1",
                kind: "Secret",
                metadata: {
                    name: "the-way-i-see-it",
                    namespace: "raphael-saadiq",
                },
            };
            assert.deepStrictEqual(c, e);
        });

        it("should remove secrets from service account", () => {
            const s: any = {
                metadata: {
                    name: "the-way-i-see-it",
                    namespace: "raphael-saadiq",
                },
                secrets: [{ name: "sdm-serviceaccount-token-f97ps" }],
            };
            const c = cleanKubernetesSpec(s, { apiVersion: "v1", kind: "ServiceAccount" });
            const e = {
                apiVersion: "v1",
                kind: "ServiceAccount",
                metadata: {
                    name: "the-way-i-see-it",
                    namespace: "raphael-saadiq",
                },
            };
            assert.deepStrictEqual(c, e);
        });

        it("should not remove secrets from non-service account", () => {
            const s: any = {
                metadata: {
                    name: "the-way-i-see-it",
                    namespace: "raphael-saadiq",
                },
                secrets: [{ name: "sdm-serviceaccount-token-f97ps" }],
            };
            const c = cleanKubernetesSpec(s, { apiVersion: "v1", kind: "SorviceAccount" });
            const e = {
                apiVersion: "v1",
                kind: "SorviceAccount",
                metadata: {
                    name: "the-way-i-see-it",
                    namespace: "raphael-saadiq",
                },
                secrets: [{ name: "sdm-serviceaccount-token-f97ps" }],
            };
            assert.deepStrictEqual(c, e);
        });

    });

    describe("selectKubernetesResources", () => {

        it("should do nothing successfully", () => {
            const r: k8s.KubernetesObject[] = [];
            const s: KubernetesResourceSelector[] = [];
            const o = selectKubernetesResources(r, s);
            assert.deepStrictEqual(o, []);
        });

        it("should return everything if no selectors", () => {
            const r = [
                { apiVersion: "v1", kind: "Secret", metadata: { name: "you-really-got-me", namespace: "kinks" } },
                { kind: "Deployment", metadata: { name: "waterloo-sunset", namespace: "something-else" } },
                { kind: "DaemonSet", metadata: { name: "sunny-afternoon", namespace: "face2face" } },
                { kind: "Service", metadata: { name: "tired-of-waiting-for-you", namespace: "kinda-kinks" } },
                { kind: "ServiceAccount", metadata: { name: "tired-of-waiting-for-you", namespace: "kinda-kinks" } },
                { kind: "ClusterRole", metadata: { name: "the-kinks-are-the-village-green-preservation-society" } },
            ];
            const e = [
                { apiVersion: "v1", kind: "Secret", metadata: { name: "you-really-got-me", namespace: "kinks" } },
                { kind: "Deployment", metadata: { name: "waterloo-sunset", namespace: "something-else" } },
                { kind: "DaemonSet", metadata: { name: "sunny-afternoon", namespace: "face2face" } },
                { kind: "Service", metadata: { name: "tired-of-waiting-for-you", namespace: "kinda-kinks" } },
                { kind: "ServiceAccount", metadata: { name: "tired-of-waiting-for-you", namespace: "kinda-kinks" } },
                { kind: "ClusterRole", metadata: { name: "the-kinks-are-the-village-green-preservation-society" } },
            ];
            [[], undefined].forEach(s => {
                const o = selectKubernetesResources(r, s);
                assert.deepStrictEqual(o, e);
            });
        });

        it("should filter resources using defaults", () => {
            const r = [
                { apiVersion: "v1", kind: "Namespace", metadata: { name: "default" } },
                { apiVersion: "v1", kind: "Namespace", metadata: { name: "kube-system" } },
                { apiVersion: "v1", kind: "Namespace", metadata: { name: "kinda-kinks" } },
                { apiVersion: "v1", kind: "Namespace", metadata: { name: "something-else" } },
                { apiVersion: "v1", kind: "Secret", metadata: { name: "you-really-got-me", namespace: "kinks" } },
                { kind: "ClusterRole", metadata: { name: "admin" } },
                { kind: "ClusterRole", metadata: { name: "cluster-admin" } },
                { kind: "ClusterRole", metadata: { name: "edit" } },
                { kind: "ClusterRole", metadata: { name: "view" } },
                { kind: "ClusterRole", metadata: { name: "cloud-provider" } },
                { kind: "ClusterRole", metadata: { name: "kubelet-api-admin" } },
                { kind: "Deployment", metadata: { name: "waterloo-sunset", namespace: "something-else" } },
                { kind: "Deployment", metadata: { name: "waterloo-sunset-mono", namespace: "something-else" } },
                { kind: "ClusterRoleBinding", metadata: { name: "cluster-admin" } },
                { kind: "ClusterRoleBinding", metadata: { name: "cluster-admin-binding" } },
                { kind: "ClusterRoleBinding", metadata: { name: "kube-apiserver-kubelet-api-admin" } },
                { kind: "ClusterRoleBinding", metadata: { name: "cloud-provider" } },
                { kind: "ClusterRoleBinding", metadata: { name: "microsoft:writer" } },
                { kind: "DaemonSet", metadata: { name: "sunny-afternoon", namespace: "face2face" } },
                { kind: "DaemonSet", metadata: { name: "kube-proxy", namespace: "kube-system" } },
                { kind: "DaemonSet", metadata: { name: "sunny-afternoon", namespace: "face-to-face" } },
                { kind: "Secret", metadata: { name: "default-token-12345", namespace: "default" }, type: "kubernetes.io/service-account-token" },
                { kind: "Service", metadata: { name: "tired-of-waiting-for-you", namespace: "kinda-kinks" } },
                { kind: "Service", metadata: { name: "kubernetes", namespace: "default" } },
                { kind: "Service", metadata: { name: "kubernetes", namespace: "nondefault" } },
                { kind: "ServiceAccount", metadata: { name: "tired-of-waiting-for-you", namespace: "kinda-kinks" } },
                { kind: "ClusterRole", metadata: { name: "gce:cloud-provider" } },
                { kind: "ClusterRole", metadata: { name: "the-kinks-are-the-village-green-preservation-society" } },
                { kind: "ClusterRoleBinding", metadata: { name: "metrics-server:system:auth-delegator" } },
            ];
            const s = defaultKubernetesFetchOptions.selectors;
            const o = selectKubernetesResources(r, s);
            const e = [
                { apiVersion: "v1", kind: "Namespace", metadata: { name: "kinda-kinks" } },
                { apiVersion: "v1", kind: "Namespace", metadata: { name: "something-else" } },
                { apiVersion: "v1", kind: "Secret", metadata: { name: "you-really-got-me", namespace: "kinks" } },
                { kind: "Deployment", metadata: { name: "waterloo-sunset", namespace: "something-else" } },
                { kind: "Deployment", metadata: { name: "waterloo-sunset-mono", namespace: "something-else" } },
                { kind: "DaemonSet", metadata: { name: "sunny-afternoon", namespace: "face2face" } },
                { kind: "DaemonSet", metadata: { name: "sunny-afternoon", namespace: "face-to-face" } },
                { kind: "Service", metadata: { name: "tired-of-waiting-for-you", namespace: "kinda-kinks" } },
                { kind: "Service", metadata: { name: "kubernetes", namespace: "nondefault" } },
                { kind: "ServiceAccount", metadata: { name: "tired-of-waiting-for-you", namespace: "kinda-kinks" } },
                { kind: "ClusterRole", metadata: { name: "the-kinks-are-the-village-green-preservation-society" } },
            ];
            assert.deepStrictEqual(o, e);
        });

        it("should properly filter resources", () => {
            const labels = {
                artist: "The Kinks",
                leadVocals: "Ray Davies",
                backingVocals: "Dave Davies",
                rhythmGuitar: "Ray Davies",
                leadGuitar: "Dave Davies",
                bass: "Pete Quaife",
                keyboards: "Ray Davies",
                drums: "Mick Avory",
                label: "Pye",
                website: "https://thekinks.info/",
            };
            const r = [
                { apiVersion: "v1", kind: "Secret", metadata: { name: "you-really-got-me", namespace: "kinks", labels } },
                { kind: "Deployment", metadata: { name: "waterloo-sunset", namespace: "something-else", labels } },
                { kind: "Deployment", metadata: { name: "waterloo-sunset-mono", namespace: "something-else", labels } },
                { kind: "DaemonSet", metadata: { name: "sunny-afternoon", namespace: "face2face", labels } },
                { kind: "DaemonSet", metadata: { name: "kube-proxy", namespace: "kube-system" } },
                { kind: "DaemonSet", metadata: { name: "sunny-afternoon", namespace: "face-to-face", labels } },
                { kind: "Service", metadata: { name: "waterloo-sunset", namespace: "something-else", labels } },
                { kind: "Service", metadata: { name: "tired-of-waiting-for-you", namespace: "kinda-kinks", labels } },
                { kind: "Service", metadata: { name: "kubernetes", namespace: "default" } },
                { kind: "ServiceAccount", metadata: { name: "tired-of-waiting-for-you", namespace: "kinda-kinks", labels } },
                { kind: "ServiceAccount", metadata: { name: "have-you-seen-her-face", namespace: "younger-than-yesterday" } },
                { kind: "ClusterRole", metadata: { name: "the-kinks-are-the-village-green-preservation-society", labels } },
            ];
            const labelSelector: k8s.V1LabelSelector = {
                matchExpressions: [
                    { key: "rhythmGuitar", operator: "Exists" },
                    { key: "label", operator: "In", values: ["Pye", "Reprise", "RCA", "Arista"] },
                    { key: "bassoon", operator: "DoesNotExist" },
                    { key: "leadVocals", operator: "NotIn", values: ["Mick Avory", "John 'Nobby' Dalton", "John Gosling"] },
                ],
                matchLabels: {
                    artist: "The Kinks",
                },
            };
            const s: KubernetesResourceSelector[] = [
                { action: "exclude", name: /^waterloo/ },
                { action: "include", kinds: [{ apiVersion: "v1", kind: "Service" }] },
                { action: "exclude", name: "kubernetes", namespace: "default" },
                { action: "include", name: "sunny-afternoon", namespace: /face/ },
                { action: "exclude", kinds: [{ apiVersion: "apps/v1", kind: "DaemonSet" }] },
                { action: "include", labelSelector },
            ];
            const o = selectKubernetesResources(r, s);
            const e = [
                { apiVersion: "v1", kind: "Secret", metadata: { name: "you-really-got-me", namespace: "kinks", labels } },
                { kind: "DaemonSet", metadata: { name: "sunny-afternoon", namespace: "face2face", labels } },
                { kind: "DaemonSet", metadata: { name: "sunny-afternoon", namespace: "face-to-face", labels } },
                { kind: "Service", metadata: { name: "tired-of-waiting-for-you", namespace: "kinda-kinks", labels } },
                { kind: "Service", metadata: { name: "kubernetes", namespace: "default" } },
                { kind: "ServiceAccount", metadata: { name: "tired-of-waiting-for-you", namespace: "kinda-kinks", labels } },
                { kind: "ClusterRole", metadata: { name: "the-kinks-are-the-village-green-preservation-society", labels } },
            ];
            assert.deepStrictEqual(o, e);
        });

    });

    describe("kubernetesResourceIdentity", () => {

        it("should return all unique objects", () => {
            const o = [
                { apiVersion: "v1", kind: "Secret", metadata: { name: "you-really-got-me", namespace: "kinks" } },
                { kind: "Deployment", metadata: { name: "waterloo-sunset", namespace: "something-else" } },
                { kind: "Deployment", metadata: { name: "waterloo-sunset-mono", namespace: "something-else" } },
                { kind: "DaemonSet", metadata: { name: "sunny-afternoon", namespace: "face2face" } },
                { kind: "DaemonSet", metadata: { name: "sunny-afternoon", namespace: "face-to-face" } },
                { kind: "Service", metadata: { name: "tired-of-waiting-for-you", namespace: "kinda-kinks" } },
                { kind: "ServiceAccount", metadata: { name: "tired-of-waiting-for-you", namespace: "kinda-kinks" } },
                { kind: "ClusterRole", metadata: { name: "the-kinks-are-the-village-green-preservation-society" } },
            ];
            const u = _.uniqBy(o, kubernetesResourceIdentity);
            const e = [
                { apiVersion: "v1", kind: "Secret", metadata: { name: "you-really-got-me", namespace: "kinks" } },
                { kind: "Deployment", metadata: { name: "waterloo-sunset", namespace: "something-else" } },
                { kind: "Deployment", metadata: { name: "waterloo-sunset-mono", namespace: "something-else" } },
                { kind: "DaemonSet", metadata: { name: "sunny-afternoon", namespace: "face2face" } },
                { kind: "DaemonSet", metadata: { name: "sunny-afternoon", namespace: "face-to-face" } },
                { kind: "Service", metadata: { name: "tired-of-waiting-for-you", namespace: "kinda-kinks" } },
                { kind: "ServiceAccount", metadata: { name: "tired-of-waiting-for-you", namespace: "kinda-kinks" } },
                { kind: "ClusterRole", metadata: { name: "the-kinks-are-the-village-green-preservation-society" } },
            ];
            assert.deepStrictEqual(u, e);
        });

        it("should filter out duplicates", () => {
            const o = [
                { kind: "Secret", metadata: { name: "you-really-got-me", namespace: "kinks" } },
                { apiVersion: "apps/v1", kind: "Deployment", metadata: { name: "waterloo-sunset", namespace: "something-else" } },
                { apiVersion: "extensions/v1beta1", kind: "Deployment", metadata: { name: "waterloo-sunset", namespace: "something-else" } },
                { apiVersion: "extensions/v1beta1", kind: "DaemonSet", metadata: { name: "sunny-afternoon", namespace: "face2face" } },
                { apiVersion: "apps/v1", kind: "DaemonSet", metadata: { name: "sunny-afternoon", namespace: "face2face" } },
                { kind: "Service", metadata: { name: "tired-of-waiting-for-you", namespace: "kinda-kinks" } },
                { kind: "ServiceAccount", metadata: { name: "tired-of-waiting-for-you", namespace: "kinda-kinks" } },
                { kind: "ClusterRole", metadata: { name: "the-kinks-are-the-village-green-preservation-society" } },
            ];
            const u = _.uniqBy(o, kubernetesResourceIdentity);
            const e = [
                { kind: "Secret", metadata: { name: "you-really-got-me", namespace: "kinks" } },
                { apiVersion: "apps/v1", kind: "Deployment", metadata: { name: "waterloo-sunset", namespace: "something-else" } },
                { apiVersion: "extensions/v1beta1", kind: "DaemonSet", metadata: { name: "sunny-afternoon", namespace: "face2face" } },
                { kind: "Service", metadata: { name: "tired-of-waiting-for-you", namespace: "kinda-kinks" } },
                { kind: "ServiceAccount", metadata: { name: "tired-of-waiting-for-you", namespace: "kinda-kinks" } },
                { kind: "ClusterRole", metadata: { name: "the-kinks-are-the-village-green-preservation-society" } },
            ];
            assert.deepStrictEqual(u, e);
        });

    });

    describe("selectorMatch", () => {

        it("should match when no name/label selectors", () => {
            const r = {
                apiVersion: "v1",
                kind: "Service",
                metadata: {
                    name: "my-back-pages",
                    namespace: "byrds",
                },
            };
            const s: KubernetesResourceSelector = {
                action: "include",
                kinds: [{ apiVersion: "v1", kind: "Service" }],
            };
            assert(selectorMatch(r, s));
        });

        it("should match on name selector", () => {
            const r = {
                apiVersion: "v1",
                kind: "Service",
                metadata: {
                    name: "my-back-pages",
                    namespace: "byrds",
                },
            };
            const s: KubernetesResourceSelector = {
                action: "include",
                kinds: [{ apiVersion: "v1", kind: "Service" }],
                name: "my-back-pages",
            };
            assert(selectorMatch(r, s));
        });

        it("should match on namespace selector", () => {
            const r = {
                apiVersion: "v1",
                kind: "Service",
                metadata: {
                    name: "my-back-pages",
                    namespace: "byrds",
                },
            };
            const s: KubernetesResourceSelector = {
                action: "include",
                kinds: [{ apiVersion: "v1", kind: "Service" }],
                namespace: /^b[iy]rds$/,
            };
            assert(selectorMatch(r, s));
        });

        it("should match on matchLabels selector", () => {
            const r = {
                apiVersion: "v1",
                kind: "Service",
                metadata: {
                    labels: {
                        album: "Younger Than Yesterday",
                        year: "1967",
                        recordLabel: "Columbia",
                    },
                    name: "my-back-pages",
                    namespace: "byrds",
                },
            };
            const s: KubernetesResourceSelector = {
                action: "include",
                kinds: [{ apiVersion: "v1", kind: "Service" }],
                labelSelector: {
                    matchLabels: {
                        album: "Younger Than Yesterday",
                        year: "1967",
                    },
                },
            };
            assert(selectorMatch(r, s));
        });

    });

    describe("kindMatch", () => {

        it("should match when no kinds", () => {
            [[], undefined].forEach(k => {
                const r = { kind: "Service" };
                assert(kindMatch(r, k));
            });
        });

        it("should match when kind is in kinds", () => {
            const r = { kind: "Service" };
            const k = [
                { apiVersion: "apps/v1", kind: "Deployment" },
                { apiVersion: "v1", kind: "Service" },
                { apiVersion: "v1", kind: "ServiceAccount" },
            ];
            assert(kindMatch(r, k));
        });

        it("should not match when kind is not in kinds", () => {
            const r = { kind: "Ingress" };
            const k = [
                { apiVersion: "apps/v1", kind: "Deployment" },
                { apiVersion: "v1", kind: "Service" },
                { apiVersion: "v1", kind: "ServiceAccount" },
            ];
            assert(!kindMatch(r, k));
        });

        it("should match regardless of apiVersion", () => {
            const r = { apiVersion: "extensions/v1beta1", kind: "Deployment" };
            const k = [
                { apiVersion: "apps/v1", kind: "Deployment" },
                { apiVersion: "v1", kind: "Service" },
                { apiVersion: "v1", kind: "ServiceAccount" },
            ];
            assert(kindMatch(r, k));
        });

    });

    describe("filterMatch", () => {

        it("should match when no filter", () => {
            const r = { kind: "Service" };
            assert(filterMatch(r, undefined));
        });

        it("should match when filter matches", () => {
            const r = { kind: "Service" };
            assert(filterMatch(r, () => true));
        });

        it("should not match when filter does not match", () => {
            const r = { kind: "Service" };
            assert(!filterMatch(r, () => false));
        });

        it("should match a service account token", () => {
            const r = {
                apiVersion: "v1",
                kind: "Secret",
                metadata: {
                    name: "default-token-7vxdj",
                    namespace: "default",
                },
                type: "kubernetes.io/service-account-token",
            };
            const f = (s: any) => s.kind === "Secret" && s.type === "kubernetes.io/service-account-token";
            assert(filterMatch(r, f));
        });

    });

    describe("kubernetesFetch", function(this: Mocha.Suite): void {

        this.timeout(15000);

        before(async function(this: Mocha.Context): Promise<void> {
            if (!await k8sAvailable()) {
                this.skip();
            }
            beforeRetry();
        });
        after(() => {
            afterRetry();
        });

        it("should fetch some resources", async () => {
            const r = await kubernetesFetch();
            assert(r, "kubernetesFetch did not return anything");
        });

    });

});
