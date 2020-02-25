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

import * as _ from "lodash";
import { metadata } from "../../../api-helper/misc/extensionPack";
import { ExtensionPack } from "../../../api/machine/ExtensionPack";
import { kubernetesUndeploy } from "./commands/kubernetesUndeploy";
import {
    mergeK8sOptions,
    SdmPackK8sOptions,
} from "./config";
import { kubernetesDeployHandler } from "./events/kubernetesDeploy";
import { providerStartupListener } from "./provider/kubernetesCluster";
import { minikubeStartupListener } from "./support/minikube";
import { syncGoals } from "./sync/goals";
import { syncRepoStartupListener } from "./sync/startup";
import { kubernetesSync } from "./sync/sync";

/**
 * Register Kubernetes deployment support for provided goals.  Any
 * provided `options` are merged with any found in the SDM
 * configuration at `sdm.k8s.options`, i.e.,
 * `sdm.configuration.sdm.k8s.options` if accessing from the SDM
 * object, with those passed in taking precedence.
 *
 * If the merged options result in a truthy `addCommands`, then the
 * [[kubernetesUndeploy]] and [[kubernetesSync]] commands are added to
 * the SDM with intents.
 *
 * The [[kubernetesDeployHandler]] event handler for this SDM is added
 * to the SDM.
 *
 * If `sync.repo` is a valid repo ref, synchronizing Kubernetes
 * resources with a Git repository is enabled.
 *
 * The [[minikubeStartupListener]] is added to the SDM to assist
 * running in local mode against a
 * [minikube](https://kubernetes.io/docs/setup/minikube/) cluster.
 *
 * @param options SDM Pack K8s options, see [[SdmPackK8sOptions]].
 * @returns SDM extension pack.
 */
export function k8sSupport(options: SdmPackK8sOptions = {}): ExtensionPack {
    return {
        ...metadata(),
        configure: sdm => {

            mergeK8sOptions(sdm, options);

            sdm.addCommand(kubernetesUndeploy(sdm));
            sdm.addCommand(kubernetesSync(sdm));

            sdm.addEvent(kubernetesDeployHandler(sdm.configuration.name));

            sdm.addStartupListener(providerStartupListener);

            sdm.addStartupListener(syncRepoStartupListener);
            syncGoals(sdm);

            sdm.addStartupListener(minikubeStartupListener);

        },
    };
}
