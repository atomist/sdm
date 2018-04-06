/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
    ProductionDeploymentGoal,
    ProductionEndpointGoal,
    StagingDeploymentGoal,
    StagingEndpointGoal,
} from "../../../common/delivery/goals/common/commonGoals";
import { NoticeK8sTestDeployCompletionOnStatus } from "../../../handlers/events/delivery/deploy/k8s/NoticeK8sDeployCompletion";
import { NoticeK8sProdDeployCompletionOnStatus } from "../../../handlers/events/delivery/deploy/k8s/NoticeK8sProdDeployCompletion";

export const K8sTestingDomain = "testing";
export const K8sProductionDomain = "production";

export const NoticeK8sTestDeployCompletion = new NoticeK8sTestDeployCompletionOnStatus(
    StagingDeploymentGoal,
    StagingEndpointGoal);

export const NoticeK8sProdDeployCompletion = new NoticeK8sProdDeployCompletionOnStatus(
    ProductionDeploymentGoal,
    ProductionEndpointGoal);
