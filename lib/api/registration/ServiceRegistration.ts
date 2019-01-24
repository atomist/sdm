/*
 * Copyright © 2019 Atomist, Inc.
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

import { RepoContext } from "../context/SdmContext";
import { SdmGoalEvent } from "../goal/SdmGoalEvent";

/**
 * Key under which services can be found in goal data.
 */
export const GoalDataServiceKey = "sdm/service";

/**
 * Register additional services for a goal.
 * This can be used to add additional containers into k8s jobs to use during goal execution.
 */
export interface ServiceRegistration<T> {
    name: string;
    service: (goalEvent: SdmGoalEvent, repo: RepoContext) => Promise<{ type: string, spec: T } | undefined>;
}
