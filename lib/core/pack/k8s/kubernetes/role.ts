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
import * as _ from "lodash";
import { errMsg } from "../support/error";
import { logRetry } from "../support/retry";
import { applicationLabels } from "./labels";
import { metadataTemplate } from "./metadata";
import { patchHeaders } from "./patch";
import {
    appName,
    KubernetesApplication,
    KubernetesResourceRequest,
    KubernetesSdm,
} from "./request";
import { logObject } from "./resource";

/**
 * Create or patch role or cluster role.
 *
 * @param req Kubernetes application request
 * @return Kubernetes resource spec used to create/update the resource
 */
export async function upsertRole(req: KubernetesResourceRequest): Promise<k8s.V1Role | k8s.V1ClusterRole> {
    const slug = appName(req);
    if (req.roleSpec.kind === "ClusterRole") {
        const spec = await clusterRoleTemplate(req);
        try {
            await req.clients.rbac.readClusterRole(spec.metadata.name);
        } catch (e) {
            logger.debug(`Failed to read cluster role ${slug}, creating: ${errMsg(e)}`);
            logger.info(`Creating cluster role ${slug} using '${logObject(spec)}'`);
            await logRetry(() => req.clients.rbac.createClusterRole(spec), `create cluster role ${slug}`);
            return spec;
        }
        logger.info(`Cluster role ${slug} exists, patching using '${logObject(spec)}'`);
        await logRetry(() => req.clients.rbac.patchClusterRole(spec.metadata.name, spec,
            undefined, undefined, undefined, undefined, patchHeaders()), `patch cluster role ${slug}`);
        return spec;
    } else {
        const spec = await roleTemplate(req);
        try {
            await req.clients.rbac.readNamespacedRole(spec.metadata.name, spec.metadata.namespace);
        } catch (e) {
            logger.debug(`Failed to read role ${slug}, creating: ${errMsg(e)}`);
            logger.info(`Creating role ${slug} using '${logObject(spec)}'`);
            await logRetry(() => req.clients.rbac.createNamespacedRole(spec.metadata.namespace, spec), `create role ${slug}`);
            return spec;
        }
        logger.info(`Role ${slug} exists, patching using '${logObject(spec)}'`);
        await logRetry(() => req.clients.rbac.patchNamespacedRole(spec.metadata.name, spec.metadata.namespace, spec,
            undefined, undefined, undefined, undefined, patchHeaders()), `patch role ${slug}`);
        return spec;
    }
}

/**
 * Create role spec for a Kubernetes application.  The
 * `req.rbac.roleSpec` is merged into the spec created by this
 * function using `lodash.merge(default, req.rbac.roleSpec)`.
 *
 * It is possible to override the role name using the
 * [[KubernetesApplication.roleSpec]].  If you do this, make sure you
 * know what you are doing and also override it in the
 * [[KubernetesApplication.roleBindingSpec]].
 *
 * @param req application request
 * @return role resource specification
 */
export async function roleTemplate(req: KubernetesApplication & KubernetesSdm): Promise<k8s.V1Role> {
    const labels = applicationLabels(req);
    const metadata = metadataTemplate({
        name: req.name,
        namespace: req.ns,
        labels,
    });
    const apiVersion = "rbac.authorization.k8s.io/v1";
    const kind = "Role";
    const r: Partial<k8s.V1Role> = {
        metadata,
        rules: [],
    };
    _.merge(r, req.roleSpec, { apiVersion, kind });
    r.metadata.namespace = req.ns;
    return r as k8s.V1Role;
}

/**
 * Create role spec for a Kubernetes application.  The
 * `req.rbac.roleSpec` is merged into the spec created by this
 * function using `lodash.merge(default, req.rbac.roleSpec)`.
 *
 * It is possible to override the cluster role name using the
 * [[KubernetesApplication.roleSpec]].  If you do this, make sure you
 * know what you are doing and also override it in the
 * [[KubernetesApplication.roleBindingSpec]].
 *
 * @param req application request
 * @return role resource specification
 */
export async function clusterRoleTemplate(req: KubernetesApplication & KubernetesSdm): Promise<k8s.V1ClusterRole> {
    const labels = applicationLabels(req);
    const metadata = metadataTemplate({
        name: req.name,
        labels,
    });
    const apiVersion = "rbac.authorization.k8s.io/v1";
    const kind = "ClusterRole";
    const r: Partial<k8s.V1ClusterRole> = {
        metadata,
        rules: [],
    };
    _.merge(r, req.roleSpec, { apiVersion, kind });
    return r as k8s.V1ClusterRole;
}
