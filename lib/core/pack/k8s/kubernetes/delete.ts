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

import { logger } from "@atomist/automation-client/lib/util/logger";
import * as k8s from "@kubernetes/client-node";
import { errMsg } from "../support/error";
import { logRetry } from "../support/retry";
import {
    K8sDeleteResponse,
    K8sListResponse,
    K8sObjectApi,
} from "./api";
import { loadKubeConfig } from "./config";
import { labelSelector } from "./labels";
import {
    appName,
    KubernetesDeleteResourceRequest,
} from "./request";
import { logObject } from "./resource";
import { specSlug } from "./spec";

/**
 * Delete a resource if it exists.  If the resource does not exist,
 * do nothing.
 *
 * @param spec Kuberenetes spec of resource to delete
 * @return DeleteResponse if object existed and was deleted, undefined if it did not exist
 */
export async function deleteSpec(spec: k8s.KubernetesObject): Promise<K8sDeleteResponse | undefined> {
    const slug = specSlug(spec);
    let client: K8sObjectApi;
    try {
        const kc = loadKubeConfig();
        client = kc.makeApiClient(K8sObjectApi);
    } catch (e) {
        e.message = `Failed to create Kubernetes client: ${errMsg(e)}`;
        throw e;
    }
    try {
        await client.read(spec);
    } catch (e) {
        logger.debug(`Kubernetes resource ${slug} does not exist: ${errMsg(e)}`);
        return undefined;
    }
    logger.info(`Deleting resource ${slug} using '${logObject(spec)}'`);
    return logRetry(() => client.delete(spec), `delete resource ${slug}`);
}

/** Collection deleter for namespaced resources. */
export type K8sNamespacedLister = (
    namespace: string,
    pretty?: string,
    allowWatchBookmarks?: boolean,
    continu?: string,
    fieldSelector?: string,
    labelSelector?: string,
    limit?: number,
    resourceVersion?: string,
    timeoutSeconds?: number,
    watch?: boolean,
    options?: any,
) => Promise<K8sListResponse>;

/** Collection deleter for cluster resources. */
export type K8sClusterLister = (
    pretty?: string,
    allowWatchBookmarks?: boolean,
    continu?: string,
    fieldSelector?: string,
    labelSelector?: string,
    limit?: number,
    resourceVersion?: string,
    timeoutSeconds?: number,
    watch?: boolean,
    options?: any,
) => Promise<K8sListResponse>;

/** Collection deleter for namespaced resources. */
export type K8sNamespacedDeleter = (
    name: string,
    namespace: string,
    pretty?: string,
    dryRun?: string,
    gracePeriodSeconds?: number,
    orphanDependents?: boolean,
    propagationPolicy?: string,
    body?: k8s.V1DeleteOptions,
    options?: any,
) => Promise<K8sDeleteResponse>;

/** Collection deleter for cluster resources. */
export type K8sClusterDeleter = (
    name: string,
    pretty?: string,
    dryRun?: string,
    gracePeriodSeconds?: number,
    orphanDependents?: boolean,
    propagationPolicy?: string,
    body?: k8s.V1DeleteOptions,
    options?: any,
) => Promise<K8sDeleteResponse>;

/** Arguments for [[deleteAppResources]]. */
export interface DeleteAppResourcesArgBase {
    /** Resource kind, e.g., "Service". */
    kind: string;
    /** Whether resource is cluster or namespace scoped. */
    namespaced: boolean;
    /** Delete request object. */
    req: KubernetesDeleteResourceRequest;
    /** API object to use as `this` for lister and deleter. */
    api: k8s.CoreV1Api | k8s.AppsV1Api | k8s.ExtensionsV1beta1Api | k8s.RbacAuthorizationV1Api;
    /** Resource collection deleting function. */
    lister: K8sNamespacedLister | K8sClusterLister;
    /** Resource collection deleting function. */
    deleter: K8sNamespacedDeleter | K8sClusterDeleter;
}
export interface DeleteAppResourcesArgNamespaced extends DeleteAppResourcesArgBase {
    namespaced: true;
    lister: K8sNamespacedLister;
    deleter: K8sNamespacedDeleter;
}
export interface DeleteAppResourcesArgCluster extends DeleteAppResourcesArgBase {
    namespaced: false;
    lister: K8sClusterLister;
    deleter: K8sClusterDeleter;
}
export type DeleteAppResourcesArg = DeleteAppResourcesArgNamespaced | DeleteAppResourcesArgCluster;

/**
 * Delete resources associated with application described by `arg.req`, if
 * any exists.  If no matching resources exist, do nothing.  Return
 * ann array of deleted resources, which may be empty.
 *
 * @param arg Specification of what and how to delete for what application
 * @return Array of deleted resources
 */
export async function deleteAppResources(arg: DeleteAppResourcesArg): Promise<k8s.KubernetesObject[]> {
    const slug = appName(arg.req);
    const selector = labelSelector(arg.req);
    const toDelete: k8s.KubernetesObject[] = [];
    try {
        const limit = 500;
        let continu: string;
        do {
            let listResp: K8sListResponse;
            const args: [string?, boolean?, string?, string?, string?, number?] =
                [undefined, undefined, continu, undefined, selector, limit];
            if (arg.namespaced) {
                listResp = await arg.lister.call(arg.api, arg.req.ns, ...args);
            } else if (arg.namespaced === false) {
                listResp = await arg.lister.apply(arg.api, args);
            }
            toDelete.push(...listResp.body.items.map(r => {
                r.kind = r.kind || arg.kind; // list response does not include kind
                return r;
            }));
            continu = listResp.body.metadata._continue;
        } while (!!continu);
    } catch (e) {
        e.message = `Failed to list ${arg.kind} for ${slug}: ${errMsg(e)}`;
        throw e;
    }
    const deleted: k8s.KubernetesObject[] = [];
    const errs: Error[] = [];
    for (const resource of toDelete) {
        const resourceSlug = arg.namespaced ? `${arg.kind}/${resource.metadata.namespace}/${resource.metadata.name}` :
            `${arg.kind}/${resource.metadata.name}`;
        logger.info(`Deleting ${resourceSlug} for ${slug}`);
        try {
            const args: [string?, string?, number?, boolean?, string?] =
                [undefined, undefined, undefined, undefined, "Background"];
            if (arg.namespaced) {
                await arg.deleter.call(arg.api, resource.metadata.name, resource.metadata.namespace, ...args);
            } else if (arg.namespaced === false) {
                await arg.deleter.call(arg.api, resource.metadata.name, ...args);
            }
            deleted.push(resource);
        } catch (e) {
            e.message = `Failed to delete ${resourceSlug} for ${slug}: ${errMsg(e)}`;
            errs.push(e);
        }
    }
    if (errs.length > 0) {
        throw new Error(`Failed to delete ${arg.kind} resources for ${slug}: ${errs.map(e => e.message).join("; ")}`);
    }
    return deleted;
}
