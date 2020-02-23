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

import { metadata } from "../../../../api-helper/misc/extensionPack";
import { ExtensionPack } from "../../../../api/machine/ExtensionPack";
import {
    isConfiguredInEnv,
    KubernetesGoalScheduler,
} from "./KubernetesGoalScheduler";

/**
 * Extension pack to schedule goals as k8s jobs when marked as isolated = true.
 */
export function k8sGoalSchedulingSupport(): ExtensionPack {
    return {
        ...metadata("k8s-goal-scheduling"),
        configure: sdm => {
            if (!process.env.ATOMIST_ISOLATED_GOAL && isConfiguredInEnv("kubernetes", "kubernetes-all")) {
                sdm.configuration.sdm.goalScheduler = [new KubernetesGoalScheduler()];
            }
        },
    };
}
