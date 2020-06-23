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

import { KubernetesApplication } from "../kubernetes/request";

export type ExternalUrls = Array<{ label?: string, url: string }>;

/**
 * Return proper SDM goal externalUrls structure or `undefined` if
 * there is no externally accessible endpoint.
 */
export function appExternalUrls(ka: KubernetesApplication): ExternalUrls | undefined {
    const url = endpointBaseUrl(ka);
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
 * does not begin and end with a forward slash, /, add them.  If the
 * ingress spec has a TLS secret the scheme is set to "https",
 * otherwise it is set to "http".  If there is not enough information
 * in the ingress spec to create an endpoint, `undefined` is returned.
 *
 * @param ka Kubernetes application
 * @return endpoint URL for deployment service
 */
export function endpointBaseUrl(ka: Pick<KubernetesApplication, "path" | "ingressSpec">): string | undefined {
    const path = endpointPath(ka);
    if (!path) {
        return undefined;
    }
    const schemeHost = kubeClusterHostScheme(ka);
    if (!schemeHost) {
        return undefined;
    }
    return `${schemeHost}${path}`;
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
 * Determine host and scheme for endpoint.  The host will be the
 * `host` property of the first element of `ka.ingressSpec.spec.rules`
 * that defines a host.  The scheme will be "https" if the host
 * appears in the list of hostnames for any ingress TLS secret,
 * otherwise "http".  If there is no ingress spec or no ingress spec
 * rules contain a host, return `undefined`.
 *
 * @param ka Kubernetes application information
 * @return "scheme://hostname" as determined from the ingress spec, or `undefined`
 */
export function kubeClusterHostScheme(ka: Pick<KubernetesApplication, "ingressSpec">): string | undefined {
    const hostRule = ka?.ingressSpec?.spec?.rules?.find(r => !!r.host);
    if (!hostRule) {
        return undefined;
    }
    const host = hostRule.host;
    const tlsSecret = ka.ingressSpec?.spec?.tls?.find(t => t.hosts?.some(h => h === host));
    const scheme = (tlsSecret) ? "https" : "http";
    return `${scheme}://${host}`;
}
