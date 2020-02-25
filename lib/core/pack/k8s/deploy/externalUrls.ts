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

import { execPromise } from "@atomist/automation-client/lib/util/child_process";
import { logger } from "@atomist/automation-client/lib/util/logger";
import { SdmGoalEvent } from "../../../../api/goal/SdmGoalEvent";
import { isInLocalMode } from "../../../internal/machine/modes";
import { KubernetesApplication } from "../kubernetes/request";

export type ExternalUrls = Array<{ label?: string, url: string }>;

/**
 * Return proper SDM goal externalUrls structure or `undefined` if
 * there is no externally accessible endpoint.
 */
export async function appExternalUrls(ka: KubernetesApplication, ge: SdmGoalEvent): Promise<ExternalUrls | undefined> {
    const url = await endpointBaseUrl(ka);
    if (!url) {
        return undefined;
    }
    const label = url.split(":")[0];
    return [{ label, url }];
}

/**
 * Create the URL for a deployment using the protocol, host, and path
 * from the [[KubernetesApplication]] object.  If `ka.path` is not
 * truthy, no ingress was created so return `undefined`.  If the path
 * does not begin and end with a forward slash, /, add them.  If
 * protocol is not provided, use "https" if tlsSecret is provided,
 * otherwise "http".  If host is not provided and the SDM is running
 * in local mode, it attempts to find the IP address of any locally
 * running Kubernetes cluster and falls back to "127.0.0.1".  If the
 * host is not given and the SDM is _not_ in local mode, `undefined`
 * is returned.
 *
 * @param ka Kubernetes application
 * @return endpoint URL for deployment service
 */
export async function endpointBaseUrl(ka: Pick<KubernetesApplication, "host" | "path" | "protocol" | "tlsSecret">): Promise<string | undefined> {
    const path = endpointPath(ka);
    if (!path) {
        return undefined;
    }
    const host = await kubeClusterHost(ka);
    if (!host) {
        return undefined;
    }
    const defaultProtocol = (ka.tlsSecret) ? "https" : "http";
    const protocol = (ka.protocol) ? ka.protocol : defaultProtocol;
    return `${protocol}://${host}${path}`;
}

/**
 * Determine path for endpoint URL.  If `ka.path` is truthy, return it
 * after ensuring it starts and ends with single forward slash, "/".
 * (Typically an ingress path begins with a forward slash but does not
 * end with one.)  Otherwise, return `undefined`.
 *
 * @param ka Kubernetes application information
 * @return Standardized URL path that begins and ends with a single forward slash or `undefined`
 */
function endpointPath(ka: Pick<KubernetesApplication, "path">): string | undefined {
    if (!ka.path) {
        return undefined;
    }
    const path = (ka.path.startsWith("/")) ? ka.path : "/" + ka.path;
    const tail = (path.endsWith("/")) ? path : path + "/";
    return tail;
}

/**
 * Determine host for endpoint.  If `ka.host` is truthy, return it.
 * Otherwise if the SDM is running in local mode, try to find IP
 * address of locally running Kubernetes cluster.  Currently only
 * minikube is supported.  If it is unable to determine an IP address
 * of a local Kubernetes cluster, it returns "127.0.0.1".  If
 * `ka.host` is falsey and the SDM is _not_ running in local mode,
 * return `undefined`.
 *
 * @param ka Kubernetes application information
 * @return Hostname or, if local, IP address for application endpoint, or `undefined`
 */
async function kubeClusterHost(ka: Pick<KubernetesApplication, "host">): Promise<string | undefined> {
    if (ka.host) {
        return ka.host;
    }
    if (!isInLocalMode()) {
        return undefined;
    }
    try {
        const minikubeIpResult = await execPromise("minikube", ["ip"]);
        const host = minikubeIpResult.stdout.trim();
        if (host) {
            return host;
        }
    } catch (e) {
        logger.debug(`Failed to run 'minikube ip': ${e.message}`);
    }
    return "127.0.0.1";
}
