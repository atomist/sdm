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
import {
    applicationLabels,
    matchLabels,
} from "./labels";
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
 * If `req.port` is truthy, create a service if it does not exist and
 * patch it if it does.  Any provided `req.serviceSpec` is merged
 * using [[serviceTemplate]] before creating/patching.
 *
 * @param req Kuberenetes application request
 * @return Kubernetes resource spec used to create/patch resource, or undefined if port not defined
 */
export async function upsertService(req: KubernetesResourceRequest): Promise<k8s.V1Service | undefined> {
    const slug = appName(req);
    if (!req.port) {
        logger.debug(`Port not provided, will not create service ${slug}`);
        return undefined;
    }
    const spec = await serviceTemplate(req);
    try {
        await req.clients.core.readNamespacedService(spec.metadata.name, spec.metadata.namespace);
    } catch (e) {
        logger.debug(`Failed to read service ${slug}, creating: ${errMsg(e)}`);
        logger.info(`Creating service ${slug} using '${logObject(spec)}'`);
        await logRetry(() => req.clients.core.createNamespacedService(spec.metadata.namespace, spec), `create service ${slug}`);
        return spec;
    }
    logger.info(`Service ${slug} exists, patching using '${logObject(spec)}'`);
    await logRetry(() => req.clients.core.patchNamespacedService(spec.metadata.name, spec.metadata.namespace, spec,
        undefined, undefined, undefined, undefined, patchHeaders()), `patch service ${slug}`);
    return spec;
}

/**
 * Create service spec to front a Kubernetes application.  If the
 * request has a `serviceSpec`, it is merged into the spec created
 * by this function using `lodash.merge(default, req.serviceSpec)`.
 *
 * It is possible to override the service name using the
 * [[KubernetesApplication.serviceSpec]].  If you do this, make sure
 * you know what you are doing.
 *
 * @param req service template request
 * @return service resource specification
 */
export async function serviceTemplate(req: KubernetesApplication & KubernetesSdm): Promise<k8s.V1Service> {
    const labels = applicationLabels(req);
    const matchers = matchLabels(req);
    const metadata = metadataTemplate({
        name: req.name,
        namespace: req.ns,
        labels,
    });
    const apiVersion = "v1";
    const kind = "Service";
    const s: k8s.V1Service = {
        apiVersion,
        kind,
        metadata,
        spec: {
            ports: [
                {
                    name: "http",
                    port: req.port,
                    targetPort: "http" as any as object,
                },
            ],
            selector: matchers,
            type: "NodePort",
        },
    };
    if (req.serviceSpec) {
        _.merge(s, req.serviceSpec, { apiVersion, kind });
        s.metadata.namespace = req.ns;
    }
    return s;
}
