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

/**
 * Kubernetes API clients used to create/update/delete application
 * resources.
 */
export interface KubernetesClients {
    /** Kubernetes Core client */
    core: k8s.CoreV1Api;
    /** Kubernetes Apps client, GA in Kubernetes 1.9 */
    apps: k8s.AppsV1Api;
    /** Kubernetes Extension client */
    ext: k8s.ExtensionsV1beta1Api;
    /** Kubernetes RBAC client, GA in Kubernetes 1.8 */
    rbac: k8s.RbacAuthorizationV1Api;
}

/**
 * Create the KubernetesClients structure.
 */
export function makeApiClients(kc: k8s.KubeConfig): KubernetesClients {
    const core = kc.makeApiClient(k8s.CoreV1Api);
    const apps = kc.makeApiClient(k8s.AppsV1Api);
    const rbac = kc.makeApiClient(k8s.RbacAuthorizationV1Api);
    const ext = kc.makeApiClient(k8s.ExtensionsV1beta1Api);
    return { core, apps, rbac, ext };
}

/**
 * Provide no-op client when only want changes persisted to the GitOps
 * sync repo.
 */
export function makeNoOpApiClients(): KubernetesClients {
    const noop = async () => { };
    const core: any = {
        createNamespace: noop,
        deleteNamespace: noop,
        patchNamespace: noop,
        readNamespace: noop,
        createNamespacedSecret: noop,
        deleteNamespacedSecret: noop,
        patchNamespacedSecret: noop,
        readNamespacedSecret: noop,
        createNamespacedService: noop,
        deleteNamespacedService: noop,
        patchNamespacedService: noop,
        readNamespacedService: noop,
        createNamespacedServiceAccount: noop,
        deleteNamespacedServiceAccount: noop,
        patchNamespacedServiceAccount: noop,
        readNamespacedServiceAccount: noop,
    };
    const apps: any = {
        createNamespacedDeployment: noop,
        deleteNamespacedDeployment: noop,
        patchNamespacedDeployment: noop,
        readNamespacedDeployment: noop,
    };
    const rbac: any = {
        createClusterRole: noop,
        deleteClusterRole: noop,
        patchClusterRole: noop,
        readClusterRole: noop,
        createClusterRoleBinding: noop,
        deleteClusterRoleBinding: noop,
        patchClusterRoleBinding: noop,
        readClusterRoleBinding: noop,
        createNamespacedRole: noop,
        deleteNamespacedRole: noop,
        patchNamespacedRole: noop,
        readNamespacedRole: noop,
        createNamespacedRoleBinding: noop,
        deleteNamespacedRoleBinding: noop,
        patchNamespacedRoleBinding: noop,
        readNamespacedRoleBinding: noop,
    };
    const ext: any = {
        createNamespacedIngress: noop,
        deleteNamespacedIngress: noop,
        patchNamespacedIngress: noop,
        readNamespacedIngress: noop,
    };
    return { core, apps, rbac, ext };
}
