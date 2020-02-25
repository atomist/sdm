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
 * Create or patch role or cluster rolebinding.
 *
 * @param req Kubernetes application request
 * @return Kubernetes resource spec used to create/patch the resource
 */
export async function upsertRoleBinding(req: KubernetesResourceRequest): Promise<k8s.V1RoleBinding | k8s.V1ClusterRoleBinding> {
    const slug = appName(req);
    if (req.roleSpec.kind === "ClusterRole") {
        const spec = await clusterRoleBindingTemplate(req);
        try {
            await req.clients.rbac.readClusterRoleBinding(spec.metadata.name);
        } catch (e) {
            logger.debug(`Failed to read cluster role binding ${slug}, creating: ${errMsg(e)}`);
            logger.info(`Creating cluster role binding ${slug} using '${logObject(spec)}'`);
            await logRetry(() => req.clients.rbac.createClusterRoleBinding(spec),
                `create cluster role binding ${slug}`);
            return spec;
        }
        logger.info(`Cluster role binding ${slug} exists, patching using '${logObject(spec)}'`);
        await logRetry(() => req.clients.rbac.patchClusterRoleBinding(spec.metadata.name, spec,
            undefined, undefined, undefined, undefined, patchHeaders()), `patch cluster role binding ${slug}`);
        return spec;
    } else {
        const spec = await roleBindingTemplate(req);
        try {
            await req.clients.rbac.readNamespacedRoleBinding(spec.metadata.name, spec.metadata.namespace);
        } catch (e) {
            logger.debug(`Failed to read role binding ${slug}, creating: ${errMsg(e)}`);
            logger.info(`Creating role binding ${slug} using '${logObject(spec)}'`);
            await logRetry(() => req.clients.rbac.createNamespacedRoleBinding(spec.metadata.namespace, spec),
                `create role binding ${slug}`);
            return spec;
        }
        logger.info(`Role binding ${slug} exists, patching using '${logObject(spec)}'`);
        await logRetry(() => req.clients.rbac.patchNamespacedRoleBinding(spec.metadata.name, spec.metadata.namespace, spec,
            undefined, undefined, undefined, undefined, patchHeaders()), `patch role binding ${slug}`);
        return spec;
    }
}

/**
 * Create role binding spec for a Kubernetes application.  The
 * `req.rbac.roleBindingSpec`, if it is not false, is merged into the
 * spec created by this function using `lodash.merge(default,
 * req.rbac.roleBindingSpec)`.
 *
 * It is possible to override the role binding name using the
 * [[KubernetesApplication.roleBindingSpec]].  If you do this, make
 * sure you know what you are doing.
 *
 * @param req application request
 * @return role binding resource specification
 */
export async function roleBindingTemplate(req: KubernetesApplication & KubernetesSdm): Promise<k8s.V1RoleBinding> {
    const labels = applicationLabels(req);
    const metadata = metadataTemplate({
        name: req.name,
        namespace: req.ns,
        labels,
    });
    const apiVersion = "rbac.authorization.k8s.io/v1";
    const kind = "RoleBinding";
    const rb: k8s.V1RoleBinding = {
        apiVersion,
        kind,
        metadata,
        roleRef: {
            apiGroup: "rbac.authorization.k8s.io",
            kind: "Role",
            name: req.name,
        },
        subjects: [
            {
                kind: "ServiceAccount",
                name: req.name,
            },
        ],
    };
    if (req.serviceAccountSpec && req.serviceAccountSpec.metadata && req.serviceAccountSpec.metadata.name) {
        rb.subjects[0].name = req.serviceAccountSpec.metadata.name;
    }
    if (req.roleBindingSpec) {
        _.merge(rb, req.roleBindingSpec, { apiVersion, kind });
        rb.metadata.namespace = req.ns;
    }
    return rb;
}

/**
 * Create cluster role binding spec for a Kubernetes application.  The
 * `req.rbac.roleBindingSpec` is merged into the
 * spec created by this function using `lodash.merge(default,
 * req.rbac.roleBindingSpec)`.
 *
 * It is possible to override the cluster role binding name using the
 * [[KubernetesApplication.roleBindingSpec]].  If you do this, make
 * sure you know what you are doing.
 *
 * @param req application request
 * @return cluster role binding resource specification
 */
export async function clusterRoleBindingTemplate(req: KubernetesApplication & KubernetesSdm): Promise<k8s.V1ClusterRoleBinding> {
    const labels = applicationLabels(req);
    const metadata = metadataTemplate({
        name: req.name,
        labels,
    });
    const apiVersion = "rbac.authorization.k8s.io/v1";
    const kind = "ClusterRoleBinding";
    const rb: k8s.V1ClusterRoleBinding = {
        apiVersion,
        kind,
        metadata,
        roleRef: {
            apiGroup: "rbac.authorization.k8s.io",
            kind: "ClusterRole",
            name: req.name,
        },
        subjects: [
            {
                kind: "ServiceAccount",
                name: req.name,
                namespace: req.ns,
            },
        ],
    };
    if (req.serviceAccountSpec && req.serviceAccountSpec.metadata && req.serviceAccountSpec.metadata.name) {
        rb.subjects[0].name = req.serviceAccountSpec.metadata.name;
    }
    if (req.roleBindingSpec) {
        _.merge(rb, req.roleBindingSpec, { apiVersion, kind });
    }
    return rb;
}
