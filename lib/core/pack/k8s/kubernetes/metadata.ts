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
import { matchLabels } from "./labels";
import { KubernetesDelete } from "./request";

/**
 * Use to be a workaround for
 * https://github.com/kubernetes-client/javascript/issues/52 , now
 * it is a no-op.
 */
export function metadataTemplate(partial: k8s.V1ObjectMeta = {}): k8s.V1ObjectMeta {
    return partial;
}

/**
 * Tune the metadata returned by [[appMetadata]].
 */
export interface AppMetadataOptions {
    /**
     * If "cluster", do not set `namespace` property.  If "namespace",
     * do not set `namespace` property and set `name` to the value of
     * `app.ns`.  If "namespaced" or anything else, set `name` and
     * `namespace` from the values in the `app`.
     */
    ns?: "cluster" | "namespace" | "namespaced";
}

/**
 * Generate the minimal metadata for the provided Kubernetes
 * application.
 *
 * @param app Kubernetes application object
 * @param opts optional tweaks to returned metadata
 * @return valid Kubernetes resource metadata
 */
export function appMetadata(app: KubernetesDelete, opts: AppMetadataOptions = {}): k8s.V1ObjectMeta {
    const md: k8s.V1ObjectMeta = {
        labels: matchLabels(app),
    };
    if (opts.ns === "cluster") {
        md.name = app.name;
    } else if (opts.ns === "namespace") {
        md.name = app.ns;
    } else {
        md.name = app.name;
        md.namespace = app.ns;
    }
    return metadataTemplate(md);
}
