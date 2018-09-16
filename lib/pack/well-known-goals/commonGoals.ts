/*
 * Copyright © 2018 Atomist, Inc.
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

import {
    Goal,
    GoalWithPrecondition,
} from "../../api/goal/Goal";
import { Goals } from "../../api/goal/Goals";
import {
    IndependentOfEnvironment,
    ProjectDisposalEnvironment,
} from "../../api/goal/support/environment";
import {
    BuildGoal,
    LocalDeploymentGoal,
    NoGoal,
} from "../../api/machine/wellKnownGoals";

/**
 * @ModuleExport
 */
export const VersionGoal = new Goal({
    uniqueName: "version",
    displayName: "version",
    environment: IndependentOfEnvironment,
    workingDescription: "Calculating project version",
    completedDescription: "Versioned",
});

/**
 * @ModuleExport
 */
export const DockerBuildGoal = new GoalWithPrecondition({
    uniqueName: "docker-build",
    displayName: "docker build",
    environment: IndependentOfEnvironment,
    workingDescription: "Running docker build",
    completedDescription: "Docker build successful",
    failedDescription: "Docker build failed",
    retryFeasible: true,
    isolated: true,
}, BuildGoal);

/**
 * @ModuleExport
 */
export const TagGoal = new GoalWithPrecondition({
    uniqueName: "tag",
    displayName: "tag",
    environment: IndependentOfEnvironment,
    workingDescription: "Tagging",
    completedDescription: "Tagged",
    failedDescription: "Failed to create Tag",
}, DockerBuildGoal, BuildGoal);

/**
 * @ModuleExport
 */
export const StagingUndeploymentGoal = new Goal({
    uniqueName: "undeploy-from-test",
    displayName: "undeploy from test",
    environment: ProjectDisposalEnvironment,
    completedDescription: "not deployed in test",
});

/**
 * @ModuleExport
 */
export const LocalUndeploymentGoal = new Goal({
    uniqueName: "undeploy-locally",
    displayName: "undeploy locally test",
    environment: ProjectDisposalEnvironment,
    failedDescription: "Failed at local undeploy",
    completedDescription: "not deployed locally",
});

/**
 * @ModuleExport
 */
// not an enforced precondition, but it's real enough to graph
export const LocalEndpointGoal = new GoalWithPrecondition({
    uniqueName: "find-local-endpoint",
    displayName: "locate local service endpoint",
    environment: IndependentOfEnvironment,
    completedDescription: "Here is the local service endpoint",
}, LocalDeploymentGoal);

/**
 * Special Goals object to be returned if changes are immaterial.
 * The identity of this object is important.
 * @type {Goals}
 * @ModuleExport
 */
export const NoGoals = new Goals(
    "No action needed",
    NoGoal);
