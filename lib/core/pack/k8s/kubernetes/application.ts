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
import { errMsg } from "../support/error";
import {
    KubernetesClients,
    makeApiClients,
    makeNoOpApiClients,
} from "./clients";
import { loadKubeConfig } from "./config";
import {
    deleteAppResources,
    DeleteAppResourcesArgCluster,
    DeleteAppResourcesArgNamespaced,
} from "./delete";
import { upsertDeployment } from "./deployment";
import { upsertIngress } from "./ingress";
import { upsertNamespace } from "./namespace";
import { upsertRbac } from "./rbac";
import {
    KubernetesApplication,
    KubernetesDelete,
    reqString,
} from "./request";
import { upsertSecrets } from "./secret";
import { upsertService } from "./service";

/**
 * Create or update all the resources for an application in a
 * Kubernetes cluster.
 *
 * @param app Kubernetes application creation request
 * @param sdmFulfiller Registered name of the SDM fulfilling the deployment goal.
 * @return Array of resource specs upserted
 */
export async function upsertApplication(app: KubernetesApplication, sdmFulfiller: string): Promise<k8s.KubernetesObject[]> {
    let clients: KubernetesClients;
    if (app.mode === "sync") {
        clients = makeNoOpApiClients();
    } else {
        let config: k8s.KubeConfig;
        try {
            config = loadKubeConfig();
        } catch (e) {
            e.message = `Failed to load Kubernetes config to deploy ${app.ns}/${app.name}: ${e.message}`;
            throw e;
        }
        clients = makeApiClients(config);
    }
    const req = { ...app, sdmFulfiller, clients };

    try {
        const k8sResources: k8s.KubernetesObject[] = [];
        k8sResources.push(await upsertNamespace(req));
        k8sResources.push(...Object.values<k8s.KubernetesObject>(await upsertRbac(req) as any));
        k8sResources.push(await upsertService(req));
        k8sResources.push(...(await upsertSecrets(req)));
        k8sResources.push(await upsertDeployment(req));
        k8sResources.push(await upsertIngress(req));
        return k8sResources.filter(r => !!r);
    } catch (e) {
        e.message = `Failed to upsert '${reqString(req)}': ${errMsg(e)}`;
        throw e;
    }
}

/**
 * Delete resources associated with an application from a Kubernetes
 * cluster.  If any resources fail to be deleted, an error is thrown.
 * If no resources associated with the application exist, it does
 * nothing successfully.
 *
 * @param req Delete application request object
 */
export async function deleteApplication(del: KubernetesDelete): Promise<k8s.KubernetesObject[]> {
    const slug = `${del.ns}/${del.name}`;
    let config: k8s.KubeConfig;
    try {
        config = loadKubeConfig();
    } catch (e) {
        e.message(`Failed to load Kubernetes config to delete ${slug}: ${e.message}`);
        throw e;
    }
    const clients = makeApiClients(config);
    const req = { ...del, clients };

    const deleted: k8s.KubernetesObject[] = [];
    const errs: Error[] = [];
    const resourceDeleters: Array<Omit<DeleteAppResourcesArgCluster, "req"> | Omit<DeleteAppResourcesArgNamespaced, "req">> = [
        {
            kind: "Ingress",
            namespaced: true,
            api: req.clients.ext,
            lister: req.clients.ext.listNamespacedIngress,
            deleter: req.clients.ext.deleteNamespacedIngress,
        },
        {
            kind: "Deployment",
            namespaced: true,
            api: req.clients.apps,
            lister: req.clients.apps.listNamespacedDeployment,
            deleter: req.clients.apps.deleteNamespacedDeployment,
        },
        {
            kind: "Secret",
            namespaced: true,
            api: req.clients.core,
            lister: req.clients.core.listNamespacedSecret,
            deleter: req.clients.core.deleteNamespacedSecret,
        },
        {
            kind: "Service",
            namespaced: true,
            api: req.clients.core,
            lister: req.clients.core.listNamespacedService,
            deleter: req.clients.core.deleteNamespacedService,
        },
        {
            kind: "ClusterRoleBinding",
            namespaced: false,
            api: req.clients.rbac,
            lister: req.clients.rbac.listClusterRoleBinding,
            deleter: req.clients.rbac.deleteClusterRoleBinding,
        },
        {
            kind: "RoleBinding",
            namespaced: true,
            api: req.clients.rbac,
            lister: req.clients.rbac.listNamespacedRoleBinding,
            deleter: req.clients.rbac.deleteNamespacedRoleBinding,
        },
        {
            kind: "ClusterRole",
            namespaced: false,
            api: req.clients.rbac,
            lister: req.clients.rbac.listClusterRole,
            deleter: req.clients.rbac.deleteClusterRole,
        },
        {
            kind: "Role",
            namespaced: true,
            api: req.clients.rbac,
            lister: req.clients.rbac.listNamespacedRole,
            deleter: req.clients.rbac.deleteNamespacedRole,
        },
        {
            kind: "ServiceAccount",
            namespaced: true,
            api: req.clients.core,
            lister: req.clients.core.listNamespacedServiceAccount,
            deleter: req.clients.core.deleteNamespacedServiceAccount,
        },
    ];
    for (const rd of resourceDeleters) {
        try {
            const x = await deleteAppResources({ ...rd, req });
            deleted.push(...x);
        } catch (e) {
            e.message = `Failed to delete ${rd.kind} for ${slug}: ${errMsg(e)}`;
            errs.push(e);
        }
    }
    if (errs.length > 0) {
        throw new Error(`Failed to delete application '${reqString(req)}': ${errs.map(e => e.message).join("; ")}`);
    }
    return deleted;
}
