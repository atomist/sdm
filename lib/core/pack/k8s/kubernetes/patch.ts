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

import { KubernetesApplication } from "./request";

/** Return type from [[patchHeaders]]. */
export interface K8sHeaders {
    headers: {
        [name: string]: string,
    };
}

/**
 * Provide Content-Type header for patch operations.  Valid values for
 * the Content-Type header when using PATCH are
 * "application/json-patch+json", "application/merge-patch+json", and
 * "application/strategic-merge-patch+json".  See
 * https://kubernetes.io/docs/tasks/run-application/update-api-object-kubectl-patch/
 * for details.
 */
export function patchHeaders(app: Pick<KubernetesApplication, "patchStrategy">): K8sHeaders {
    const contentType = (app?.patchStrategy) ? app.patchStrategy : "application/strategic-merge-patch+json";
    return {
        headers: {
            "Content-Type": contentType,
        },
    };
}
