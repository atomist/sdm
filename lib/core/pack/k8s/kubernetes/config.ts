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
import { SoftwareDeliveryMachine } from "../../../../api/machine/SoftwareDeliveryMachine";

/**
 * Get Kubernetes configuration.  It first tries to
 * `loadFromDefault()`, which looks in the standard locations for a
 * Kubernetes config file.  If that fails, it attempts to load the
 * in-cluster client credentials.  If both fail, it throws an error.
 */
export function loadKubeConfig(): k8s.KubeConfig {
    const kc = new k8s.KubeConfig();
    try {
        kc.loadFromDefault();
    } catch (e) {
        kc.loadFromCluster();
    }
    return kc;
}

/**
 * Get Kubernetes configuration.  It first tries to load the
 * in-cluster client credentials.  If that fails, it tries
 * `loadFromDefault()`, which looks in the standard locations for a
 * Kubernetes config file.  If both fail, it returns the empty
 * configuration object.
 */
export function loadKubeClusterConfig(): k8s.KubeConfig {
    const kc = new k8s.KubeConfig();
    try {
        kc.loadFromCluster();
    } catch (e) {
        try {
            kc.loadFromDefault();
        } catch (ex) {
            // ignore
        }
    }
    return kc;
}

/**
 * If the SDM configuration contains a Kubernetes config context,
 * validate it exists in the default Kubernetes config.  If the SDM
 * context is not available in the Kubernetes config, an error is
 * thrown.
 *
 * If there is no context in the SDM configuration, read the current
 * context from the default Kubernetes config and set it in the SDM
 * configuration.
 *
 * If this function is unable to read the default Kubernetes config,
 * it throws an error.
 *
 * @param sdm Running Software Delivery Machine.
 * @return Valid Kubernetes config context.
 */
export function kubeConfigContext(sdm: SoftwareDeliveryMachine): string | undefined {
    const kc = new k8s.KubeConfig();
    try {
        kc.loadFromDefault();
    } catch (e) {
        e.message = `Failed to to load default Kubernetes config: ${e.message}`;
        throw e;
    }

    if (sdm.configuration.sdm.k8s.options.context) {
        if (!kc.contexts.some(c => c.name === sdm.configuration.sdm.k8s.options.context)) {
            const msg = "Kubernetes config context in SDM configuration does not exist in default Kubernetes config" +
                `Available Kubernetes config contexts: ${kc.contexts.map(c => c.name).join(",")}`;
            throw new Error(msg);
        }
    } else if (kc.currentContext) {
        sdm.configuration.sdm.k8s.options.context = kc.currentContext;
    }

    return sdm.configuration.sdm.k8s.options.context as string;
}
