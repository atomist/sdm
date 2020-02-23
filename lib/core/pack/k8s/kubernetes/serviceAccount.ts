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
 * Create or patch service account.
 *
 * @param req Kuberenetes application request
 * @return Kubernetes resource spec used to create/patch the resource
 */
export async function upsertServiceAccount(req: KubernetesResourceRequest): Promise<k8s.V1ServiceAccount> {
    const slug = appName(req);
    const spec = await serviceAccountTemplate(req);
    try {
        await req.clients.core.readNamespacedServiceAccount(spec.metadata.name, spec.metadata.namespace);
    } catch (e) {
        logger.debug(`Failed to read service account ${slug}, creating: ${errMsg(e)}`);
        logger.info(`Creating service account ${slug} using '${logObject(spec)}'`);
        await logRetry(() => req.clients.core.createNamespacedServiceAccount(spec.metadata.namespace, spec),
            `create service account ${slug}`);
        return spec;
    }
    logger.info(`Service account ${slug} exists, patching using '${logObject(spec)}'`);
    await logRetry(() => req.clients.core.patchNamespacedServiceAccount(spec.metadata.name, spec.metadata.namespace, spec,
        undefined, undefined, undefined, undefined, patchHeaders()), `patch service account ${slug}`);
    return spec;
}

/**
 * Create service account spec for a Kubernetes application.  The
 * `req.rbac.serviceAccountSpec`, if it not false, is merged into the
 * spec created by this function using `lodash.merge(default,
 * req.rbac.serviceAccountSpec)`.
 *
 * It is possible to override the service account name using the
 * [[KubernetesApplication.serviceAccountSpec]].  If you do this, make
 * sure you know what you are doing and also override it in the
 * [[KubernetesApplication.roleBindingSpec]].
 *
 * @param req application request
 * @return service account resource specification
 */
export async function serviceAccountTemplate(req: KubernetesApplication & KubernetesSdm): Promise<k8s.V1ServiceAccount> {
    const labels = applicationLabels(req);
    const metadata = metadataTemplate({
        name: req.name,
        namespace: req.ns,
        labels,
    });
    const apiVersion = "v1";
    const kind = "ServiceAccount";
    const sa: k8s.V1ServiceAccount = {
        apiVersion,
        kind,
        metadata,
    };
    if (req.serviceAccountSpec) {
        _.merge(sa, req.serviceAccountSpec, { apiVersion, kind });
        sa.metadata.namespace = req.ns;
    }
    return sa;
}
