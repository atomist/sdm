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

import { webhookBaseUrl } from "@atomist/automation-client/lib/atomistWebhook";
import { logger } from "@atomist/automation-client/lib/util/logger";
import * as k8s from "@kubernetes/client-node";
import * as stringify from "json-stringify-safe";
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
 * Create or update a deployment for a Kubernetes application.  Any
 * provided `req.deploymentSpec` is merged using
 * [[deploymentTemplate]] before creating/patching.
 *
 * @param req Kuberenetes application request
 * @return Kubernetes spec used to create/update resource
 */
export async function upsertDeployment(req: KubernetesResourceRequest): Promise<k8s.V1Deployment> {
    const slug = appName(req);
    const spec = await deploymentTemplate(req);
    try {
        await req.clients.apps.readNamespacedDeployment(spec.metadata.name, spec.metadata.namespace);
    } catch (e) {
        logger.debug(`Failed to read deployment ${slug}, creating: ${errMsg(e)}`);
        logger.info(`Creating deployment ${slug} using '${logObject(spec)}'`);
        await logRetry(() => req.clients.apps.createNamespacedDeployment(spec.metadata.namespace, spec),
            `create deployment ${slug}`);
        return spec;
    }
    logger.info(`Updating deployment ${slug} using '${logObject(spec)}'`);
    await logRetry(() => req.clients.apps.patchNamespacedDeployment(spec.metadata.name, spec.metadata.namespace, spec,
        undefined, undefined, undefined, undefined, patchHeaders()), `patch deployment ${slug}`);
    return spec;
}

/**
 * Create deployment spec for a Kubernetes application.  If the
 * request has a `deploymentSpec`, it is merged into the default spec
 * created by this function using `lodash.merge(default, req.deploymentSpec)`.
 *
 * It is possible to override the deployment name using the
 * [[KubernetesApplication.deploymentSpec]].  If you do this, make
 * sure you know what you are doing.
 *
 * @param req Kubernetes application request
 * @return deployment resource specification
 */
export async function deploymentTemplate(req: KubernetesApplication & KubernetesSdm): Promise<k8s.V1Deployment> {
    const k8ventAnnot = stringify({
        webhooks: [`${webhookBaseUrl()}/atomist/kube/teams/${req.workspaceId}`],
    });
    const labels = applicationLabels(req);
    const matchers = matchLabels(req);
    const metadata = metadataTemplate({
        name: req.name,
        namespace: req.ns,
        labels,
    });
    const podMetadata = metadataTemplate({
        name: req.name,
        labels,
        annotations: {
            "atomist.com/k8vent": k8ventAnnot,
        },
    });
    const selector: k8s.V1LabelSelector = {
        matchLabels: matchers,
    } as any;
    const apiVersion = "apps/v1";
    const kind = "Deployment";
    const d: k8s.V1Deployment = {
        apiVersion,
        kind,
        metadata,
        spec: {
            replicas: (req.replicas || req.replicas === 0) ? req.replicas : 1,
            selector,
            strategy: {
                type: "RollingUpdate",
                rollingUpdate: {
                    maxUnavailable: 0 as any as object,
                    maxSurge: 1 as any as object,
                },
            },
            template: {
                metadata: podMetadata,
                spec: {
                    containers: [
                        {
                            image: req.image,
                            name: req.name,
                            resources: {
                                limits: {
                                    cpu: "1000m",
                                    memory: "384Mi",
                                },
                                requests: {
                                    cpu: "100m",
                                    memory: "320Mi",
                                },
                            },
                        },
                    ],
                },
            },
        },
    };
    if (req.port) {
        d.spec.template.spec.containers[0].ports = [
            {
                name: "http",
                containerPort: req.port,
            } as any,
        ];
        const probe: k8s.V1Probe = {
            httpGet: {
                path: "/",
                port: "http",
            },
            initialDelaySeconds: 30,
        } as any;
        d.spec.template.spec.containers[0].readinessProbe = probe;
        d.spec.template.spec.containers[0].livenessProbe = probe;
    }
    if (req.imagePullSecret) {
        d.spec.template.spec.imagePullSecrets = [{ name: req.imagePullSecret }];
    }
    if (req.roleSpec) {
        d.spec.template.spec.serviceAccountName = _.get(req, "serviceAccountSpec.metadata.name", req.name);
    }
    if (req.deploymentSpec) {
        _.merge(d, req.deploymentSpec, { apiVersion, kind });
        d.metadata.namespace = req.ns;
    }
    return d;
}
