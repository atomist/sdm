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
import { DeepPartial } from "ts-essentials";
import { RepoContext } from "../../../../api/context/SdmContext";
import { SdmGoalEvent } from "../../../../api/goal/SdmGoalEvent";
import { ServiceRegistration } from "../../../../api/registration/ServiceRegistration";

/**
 * Key of k8s services inside the service structure of goal data
 */
export enum K8sServiceRegistrationType {
    K8sService = "@atomist/sdm/service/k8s",
}

/**
 * K8s specific service spec
 *
 * Allows to register additional containers that are being added to the goal job.
 * Open for future extension to support adding other k8s resource types.
 */
export interface K8sServiceSpec {
    /** Additional containers to be added into the goal job. */
    container?: DeepPartial<k8s.V1Container> | Array<DeepPartial<k8s.V1Container>>;
    /** Additional init containers to be added into the goal job. */
    initContainer?: DeepPartial<k8s.V1Container> | Array<DeepPartial<k8s.V1Container>>;

    /** Additional volumes to be added into the goal job. */
    volume?: DeepPartial<k8s.V1Volume> | Array<DeepPartial<k8s.V1Volume>>;
    /**
     * Additional volumeMounts to be added into the goal job.  Each
     * will be added to all containers and initContainers.
     */
    volumeMount?: DeepPartial<k8s.V1VolumeMount> | Array<DeepPartial<k8s.V1VolumeMount>>;

    /** Additional image pull secrets to be added into the goal job. */
    imagePullSecret?: DeepPartial<k8s.V1LocalObjectReference> | Array<DeepPartial<k8s.V1LocalObjectReference>>;
}

/**
 * K8s specific service registration
 */
export interface K8sServiceRegistration extends ServiceRegistration<K8sServiceSpec> {
    service: (goalEvent: SdmGoalEvent, repo: RepoContext) => Promise<{
        type: K8sServiceRegistrationType.K8sService;
        spec: K8sServiceSpec;
    } | undefined>;
}
