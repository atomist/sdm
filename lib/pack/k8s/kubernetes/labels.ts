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
import { KubernetesResourceRequest } from "./request";

/**
 * Remove objectionable characters from a Kubernetes label value.
 * The validation regular expression for a label value is
 * /^(([A-Za-z0-9][-A-Za-z0-9_.]*)?[A-Za-z0-9])?$/.
 *
 * @param value The label value
 * @return A valid label value based on the input
 */
export function safeLabelValue(value: string): string {
    return value.replace(/^[^A-Za-z0-9]+/, "")
        .replace(/[^A-Za-z0-9]+$/, "")
        .replace(/[^-A-Za-z0-9_.]+/g, "_");
}

/** Input type for matchLabels function. */
export type MatchLabelInput = Pick<KubernetesResourceRequest, "name" | "workspaceId">;

/**
 * Returns the subset of the default set of labels for that should be
 * used in a matchLabels to match a resource.
 *
 * @param req A Kubernetes request object containing at least the "name" and "workspaceId" properties
 * @return Kubernetes object metadata labels object
 */
export function matchLabels(req: MatchLabelInput): { [key: string]: string } {
    return {
        "app.kubernetes.io/name": req.name,
        "atomist.com/workspaceId": req.workspaceId,
    };
}

/**
 * Provide label selector string suitable for passing to a Kubernetes
 * API call for the provided `req` object.
 *
 * @param req A Kubernetes request object containing at least the "name" and "workspaceId" properties
 * @return Kubernetes label selector string
 */
export function labelSelector(req: MatchLabelInput): string {
    const matchers = matchLabels(req);
    return Object.keys(matchers).map(l => `${l}=${matchers[l]}`).join(",");
}

export type KubernetesApplicationLabelInput = Pick<KubernetesResourceRequest, "name" | "sdmFulfiller" | "workspaceId">;

/**
 * Support for the Kubernetes recommended set of labels,
 * https://kubernetes.io/docs/concepts/overview/working-with-objects/common-labels/
 */
export interface KubernetesLabelInput {
    /** The component within the application architecture. */
    component?: string;
    /** A unique name identifying the instance of an application */
    instance?: string;
    /** Version of this application. */
    version?: string;
}

/** Input type for the labels function. */
export type ApplicationLabelInput = KubernetesApplicationLabelInput & KubernetesLabelInput;

/**
 * Create a default set of labels for a resource.  The returned set
 * satisfy the recommendations from
 * https://kubernetes.io/docs/concepts/overview/working-with-objects/common-labels/
 */
export function applicationLabels(req: ApplicationLabelInput): { [key: string]: string } {
    const matchers = matchLabels(req);
    const labels: { [key: string]: string } = {
        ...matchers,
        "app.kubernetes.io/part-of": req.name,
        "app.kubernetes.io/managed-by": safeLabelValue(req.sdmFulfiller),
    };
    if (req.component) {
        labels["app.kubernetes.io/component"] = req.component;
    }
    if (req.instance) {
        labels["app.kubernetes.io/instance"] = req.instance;
    }
    if (req.version) {
        labels["app.kubernetes.io/version"] = req.version;
    }
    return labels;
}

/**
 * Determine if labels match selector.  If the selector contains no
 * label selector, it is considered a match.  If the the matchLabels
 * contain no properties, it is considered matching.  If the
 * matchExpressions array is empty, it is considered matching.
 *
 * @param spec Kubernetes object spec
 * @param selector Kubernetes label selector
 * @return Return `true` if it is a match, `false` otherwise
 */
export function labelMatch(spec: k8s.KubernetesObject, selector?: k8s.V1LabelSelector): boolean {
    if (!selector) {
        return true;
    }
    if (!spec.metadata || !spec.metadata.labels) {
        return false;
    }
    if (selector.matchLabels) {
        for (const label of Object.keys(selector.matchLabels)) {
            if (!spec.metadata.labels.hasOwnProperty(label) || spec.metadata.labels[label] !== selector.matchLabels[label]) {
                return false;
            }
        }
    }
    if (selector.matchExpressions) {
        for (const expr of selector.matchExpressions) {
            switch (expr.operator) {
                case "Exists":
                    if (!spec.metadata.labels.hasOwnProperty(expr.key)) {
                        return false;
                    }
                    break;
                case "DoesNotExist":
                    if (spec.metadata.labels.hasOwnProperty(expr.key)) {
                        return false;
                    }
                    break;
                case "In":
                    if (!spec.metadata.labels.hasOwnProperty(expr.key) || !expr.values.includes(spec.metadata.labels[expr.key])) {
                        return false;
                    }
                    break;
                case "NotIn":
                    if (spec.metadata.labels.hasOwnProperty(expr.key) && expr.values.includes(spec.metadata.labels[expr.key])) {
                        return false;
                    }
                    break;
                default:
                    throw new Error(`Unsupported match expression operator: ${expr.operator}`);
                    break;
            }
        }
    }
    return true;
}
