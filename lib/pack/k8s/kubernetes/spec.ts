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
import * as yaml from "js-yaml";
import * as stableStringify from "json-stable-stringify";
import * as stringify from "json-stringify-safe";
import { encryptSecret } from "./secret";

/**
 * Create a suitable basename for the spec file for `resource`.  The
 * form of the file name is "NN-NAMESPACE-NAME-KIND", where "NN" is a
 * numeric prefix so the resources are created in the proper order,
 * "NAMESPACE-" is omitted if resource is not namespaced, the kind is
 * converted from PascalCase to kebab-case, and the whole name is
 * lowercased.
 *
 * @param resource Kubernetes resource spec
 * @return Base file name for resource spec
 */
export function kubernetesSpecFileBasename(resource: k8s.KubernetesObject): string {
    let prefix: string;
    switch (resource.kind) {
        case "Namespace":
            prefix = "10";
            break;
        case "PersistentVolume":
        case "StorageClass":
            prefix = "15";
            break;
        case "ServiceAccount":
            prefix = "20";
            break;
        case "ClusterRole":
        case "Role":
            prefix = "25";
            break;
        case "ClusterRoleBinding":
        case "RoleBinding":
            prefix = "30";
            break;
        case "NetworkPolicy":
        case "PersistentVolumeClaim":
        case "PodSecurityPolicy":
            prefix = "40";
            break;
        case "Service":
            prefix = "50";
            break;
        case "ConfigMap":
        case "Secret":
            prefix = "60";
            break;
        case "CronJob":
        case "DaemonSet":
        case "Deployment":
        case "StatefulSet":
            prefix = "70";
            break;
        case "HorizontalPodAutoscaler":
        case "Ingress":
        case "PodDisruptionBudget":
            prefix = "80";
            break;
        default:
            prefix = "90";
            break;
    }
    const ns = (resource.metadata.namespace) ? `${resource.metadata.namespace}_` : "";
    const kebabKind = resource.kind.replace(/([a-z])([A-Z])/g, "$1-$2");
    return `${prefix}_${ns}${resource.metadata.name}_${kebabKind}`.toLowerCase();
}

/**
 * Options for creating a string representation of a Kubernetes
 * resource specification.
 */
export interface KubernetesSpecStringifyOptions {
    /**
     * Serialization format, either "json" or "yaml".  The default is
     * "json".
     */
    format?: "json" | "yaml";
    /**
     * The key to use to encrypt v1/Secret data values.  See
     * [[encryptSecret]] for details.  If no value is provided, the
     * secret data values are not encrypted.
     */
    secretKey?: string;
}

/**
 * Convert a Kubernetes resource spec into a stable string suitable
 * for writing to a file or comparisons.
 *
 * @param resource Kubernetes resource to stringify
 * @param options Options for serializing the resource spec
 * @return Stable string representation of the resource spec
 */
export async function kubernetesSpecStringify(spec: k8s.KubernetesObject, options: KubernetesSpecStringifyOptions = {}): Promise<string> {
    let resource = spec;
    if (resource.kind === "Secret" && options.secretKey) {
        resource = await encryptSecret(resource, options.secretKey);
    }
    if (options.format === "yaml") {
        return yaml.safeDump(resource, { sortKeys: true });
    } else {
        return stableStringify(resource, { space: 2 }) + "\n";
    }
}

/**
 * Parses content of string as Kubernetes JSON or YAML specs.  It
 * parses the file as YAML, since JSON is valid YAML, and returns an
 * array of [[k8s.KubernetesObject]]s, since a YAML file can contain multiple
 * documents.  It validates that each document parsed looks something
 * like a Kubernetes spec.  If it does not, it is filtered out of the
 * returned specs.
 *
 * @param specString String representation of Kubernetes spec(s)
 * @return Parsed and filtered Kubernetes spec objects
 */
export function parseKubernetesSpecs(specString: string): k8s.KubernetesObject[] {
    if (!specString) {
        return [];
    }
    try {
        const specs: k8s.KubernetesObject[] = yaml.safeLoadAll(specString);
        return specs.filter(s => s && s.apiVersion && s.kind && s.metadata && s.metadata.name);
    } catch (e) {
        e.spec = specString;
        e.message = `Failed to parse Kubernetes spec '${specStringSnippet(specString)}': ${e.message}`;
        throw e;
    }
}

/** Return unique string for spec. */
export function specSlug(spec: k8s.KubernetesObject): string {
    const parts: string[] = [spec.apiVersion];
    if (spec.metadata && spec.metadata.namespace) {
        parts.push(spec.metadata.namespace);
    }
    const plural = spec.kind.toLowerCase().replace(/s$/, "se").replace(/y$/, "ie") + "s";
    parts.push(plural, spec.metadata.name);
    return parts.join("/");
}

/** Convert spec to string and shorten it if necessary. */
export function specSnippet(spec: k8s.KubernetesObject): string {
    return specStringSnippet(stringify(spec));
}

/** Return beginning snippet from spec string. */
export function specStringSnippet(spec: string): string {
    const max = 200;
    if (spec.length > max) {
        return spec.substring(0, max - 4) + "...}";
    } else {
        return spec;
    }
}
