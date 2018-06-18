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

import { Goal, GoalWithPrecondition } from "../../api/goal/Goal";
import { Goals } from "../../api/goal/Goals";
import { IndependentOfEnvironment, ProjectDisposalEnvironment } from "../../api/goal/support/environment";
import { BuildGoal, LocalDeploymentGoal, NoGoal } from "../../api/machine/wellKnownGoals";

export const VersionGoal = new Goal({
    uniqueName: "Version",
    environment: IndependentOfEnvironment,
    orderedName: "0.1-version",
    workingDescription: "Calculating project version...",
    completedDescription: "Versioned",
});

export const DockerBuildGoal = new GoalWithPrecondition({
    uniqueName: "DockerBuild",
    environment: IndependentOfEnvironment,
    orderedName: "3-docker",
    displayName: "docker build",
    workingDescription: "Running Docker build...",
    completedDescription: "Docker build successful",
    failedDescription: "Failed to build Docker image",
    isolated: true,
}, BuildGoal);

export const TagGoal = new GoalWithPrecondition({
    uniqueName: "Tag",
    environment: IndependentOfEnvironment,
    orderedName: "4-tag",
    displayName: "tag",
    workingDescription: "Tagging...",
    completedDescription: "Tagged",
    failedDescription: "Failed to create Tag",
}, DockerBuildGoal, BuildGoal);

export const StagingUndeploymentGoal = new Goal({
    uniqueName: "UndeployFromTest",
    environment: ProjectDisposalEnvironment,
    orderedName: "2-staging-undeploy",
    displayName: "undeploy from test",
    completedDescription: "not deployed in test",
});

export const LocalUndeploymentGoal = new Goal({
    uniqueName: "UndeployHere",
    environment: ProjectDisposalEnvironment,
    orderedName: "1-undeploy-locally",
    failedDescription: "Failed at local undeploy",
    completedDescription: "not deployed locally",
});

// not an enforced precondition, but it's real enough to graph
export const LocalEndpointGoal = new GoalWithPrecondition({
    uniqueName: "FindLocalEndpoint",
    environment: IndependentOfEnvironment,
    orderedName: "2-endpoint",
    displayName: "locate local service endpoint",
    completedDescription: "Here is the local service endpoint",

}, LocalDeploymentGoal);

/**
 * Special Goals object to be returned if changes are immaterial.
 * The identity of this object is important.
 * @type {Goals}
 */
export const NoGoals = new Goals(
    "No action needed",
    NoGoal);
