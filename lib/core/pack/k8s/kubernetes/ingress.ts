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
 * If `req.port` and `req.path` are truthy, create or patch an ingress
 * for a Kubernetes application.  Any provided `req.ingressSpec` is
 * merged using [[ingressTemplate]] before creating/patching.
 *
 * @param req Kuberenetes resource request
 * @return Kubernetes spec used to create/patch resource
 */
export async function upsertIngress(req: KubernetesResourceRequest): Promise<k8s.NetworkingV1beta1Ingress | undefined> {
    const slug = appName(req);
    if (!req.port) {
        logger.debug(`Port not provided, will not create ingress ${slug}`);
        return undefined;
    }
    if (!req.path) {
        logger.debug(`Path not provided, will not upsert ingress ${slug}`);
        return undefined;
    }
    const spec = await ingressTemplate(req);
    try {
        await req.clients.ext.readNamespacedIngress(spec.metadata.name, spec.metadata.namespace);
    } catch (e) {
        logger.debug(`Failed to read ingress ${slug}, creating: ${errMsg(e)}`);
        logger.info(`Creating ingress ${slug} using '${logObject(spec)}'`);
        await logRetry(() => req.clients.ext.createNamespacedIngress(spec.metadata.namespace, spec), `create ingress ${slug}`);
        return spec;
    }
    logger.info(`Ingress ${slug} exists, patching using '${logObject(spec)}'`);
    await logRetry(() => req.clients.ext.patchNamespacedIngress(spec.metadata.name, spec.metadata.namespace, spec,
        undefined, undefined, undefined, undefined, patchHeaders()), `patch ingress ${slug}`);
    return spec;
}

/**
 * Create an ingress HTTP path.
 *
 * @param req ingress request
 * @return ingress HTTP path
 */
function httpIngressPath(req: KubernetesApplication): k8s.NetworkingV1beta1HTTPIngressPath {
    const httpPath: k8s.NetworkingV1beta1HTTPIngressPath = {
        path: req.path,
        backend: {
            serviceName: req.name,
            servicePort: "http" as any as object,
        },
    };
    return httpPath;
}

/**
 * Create the ingress for a deployment namespace.  If the
 * request has an `ingressSpec`, it is merged into the spec created
 * by this function using `lodash.merge(default, req.ingressSpec)`.
 *
 * It is possible to override the ingress name using the
 * [[KubernetesApplication.ingressSpec]].  If you do this, make sure
 * you know what you are doing.
 *
 * @param req Kubernestes application
 * @return ingress spec with single rule
 */
export async function ingressTemplate(req: KubernetesApplication & KubernetesSdm): Promise<k8s.NetworkingV1beta1Ingress> {
    const labels = applicationLabels(req);
    const metadata = metadataTemplate({
        name: req.name,
        namespace: req.ns,
        labels,
    });
    const httpPath = httpIngressPath(req);
    const rule: k8s.NetworkingV1beta1IngressRule = {
        http: {
            paths: [httpPath],
        },
    } as any;
    if (req.host) {
        rule.host = req.host;
    }
    const apiVersion = "extensions/v1beta1";
    const kind = "Ingress";
    const i: k8s.NetworkingV1beta1Ingress = {
        apiVersion,
        kind,
        metadata,
        spec: {
            rules: [rule],
        },
    };
    if (req.tlsSecret) {
        i.spec.tls = [
            {
                secretName: req.tlsSecret,
            } as any,
        ];
        if (req.host) {
            i.spec.tls[0].hosts = [req.host];
        }
    }
    if (req.ingressSpec) {
        _.merge(i, req.ingressSpec, { apiVersion, kind });
        i.metadata.namespace = req.ns;
    }
    return i;
}
