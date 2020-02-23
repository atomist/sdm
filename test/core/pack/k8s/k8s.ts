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
import * as retry from "@atomist/automation-client/lib/util/retry";

let minikube: boolean;
/** See if a local Kubernetes cluster is available. */
export async function k8sAvailable(): Promise<boolean> {
    if (minikube === undefined) {
        try {
            // see if minikube is available and responding
            await execPromise("kubectl", ["config", "use-context", "minikube"]);
            await execPromise("kubectl", ["get", "--request-timeout=200ms", "pods"]);
            minikube = true;
        } catch (e) {
            minikube = false;
        }
    }
    return minikube;
}

/** Generate a random number and return it as a string. */
export function rng(): string {
    return Math.floor(Math.random() * 1000000).toString(10);
}

let origDefaultRetryOptions: any;

/** Disable retry before tests. */
export function beforeRetry(): void {
    origDefaultRetryOptions = Object.getOwnPropertyDescriptor(retry, "DefaultRetryOptions");
    Object.defineProperty(retry, "DefaultRetryOptions", {
        value: {
            retries: 0,
            factor: 1,
            minTimeout: 10,
            maxTimeout: 10,
            randomize: false,
            log: false,
        },
    });
}

/** Enable retry after tests. */
export function afterRetry(): void {
    if (origDefaultRetryOptions) {
        Object.defineProperty(retry, "DefaultRetryOptions", origDefaultRetryOptions);
    }
}
