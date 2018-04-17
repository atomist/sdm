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
    IndependentOfEnvironment,
    ProductionEnvironment,
    StagingEnvironment,
} from "../gitHubContext";
import { GoalWithPrecondition } from "../Goal";
import { Goals } from "../Goals";
import {
    ArtifactGoal,
    AutofixGoal,
    BuildGoal,
    DockerBuildGoal,
    ReviewGoal,
    StagingDeploymentGoal,
    StagingEndpointGoal,
    VersionGoal,
} from "./commonGoals";

export const NpmBuildGoal = new GoalWithPrecondition({
    uniqueCamelCaseName: "Build",
    environment: IndependentOfEnvironment,
    orderedName: "2-build",
    displayName: "build",
    workingDescription: "Building...",
    completedDescription: "Build successful",
    failedDescription: "Build failed",
    fork: true,
}, AutofixGoal);

export const NpmDockerBuildGoal = new GoalWithPrecondition({
    uniqueCamelCaseName: "DockerBuild",
    environment: IndependentOfEnvironment,
    orderedName: "3-docker",
    displayName: "docker build",
    workingDescription: "Running Docker build...",
    completedDescription: "Docker build successful",
    failedDescription: "Failed to build Docker image",
    fork: true,
}, NpmBuildGoal);

export const NpmPublishGoal = new GoalWithPrecondition({
    uniqueCamelCaseName: "Publish",
    environment: IndependentOfEnvironment,
    orderedName: "2-publish",
    displayName: "publish",
    workingDescription: "Publishing...",
    completedDescription: "Published",
    failedDescription: "Published failed",
    fork: true,
}, NpmBuildGoal);

export const NpmTagGoal = new GoalWithPrecondition({
    uniqueCamelCaseName: "Tag",
    environment: IndependentOfEnvironment,
    orderedName: "4-tag",
    displayName: "tag",
    workingDescription: "Tagging...",
    completedDescription: "Tagged",
    failedDescription: "Failed to create Tag",
}, NpmDockerBuildGoal, NpmBuildGoal);

export const StagingDockerDeploymentGoal = new GoalWithPrecondition({
    uniqueCamelCaseName: "DeployToTest",
    environment: StagingEnvironment,
    orderedName: "3-deploy",
    displayName: "deploy to Test",
    completedDescription: "Deployed to Test",
    failedDescription: "Test deployment failure",
    waitingForApprovalDescription: "Promote to Prod",
}, DockerBuildGoal);

export const ProductionDockerDeploymentGoal = new GoalWithPrecondition({
    uniqueCamelCaseName: "DeployToProduction",
    environment: ProductionEnvironment,
    orderedName: "3-prod-deploy",
    displayName: "deploy to Prod",
    completedDescription: "Deployed to Prod",
    failedDescription: "Prod deployment failure",
}, StagingDockerDeploymentGoal);

export const NpmDeployGoals = new Goals(
    "Node.js Deploy",
    ReviewGoal,
    AutofixGoal,
    BuildGoal,
    ArtifactGoal,
    StagingDeploymentGoal,
    StagingEndpointGoal,
);

export const NpmBuildGoals = new Goals(
    "Node.js Build",
    VersionGoal,
    ReviewGoal,
    AutofixGoal,
    NpmBuildGoal,
    NpmPublishGoal,
    NpmTagGoal,
);

export const NpmDockerGoals = new Goals(
    "Node.js Docker Build",
    VersionGoal,
    ReviewGoal,
    AutofixGoal,
    NpmBuildGoal,
    NpmPublishGoal,
    DockerBuildGoal,
    NpmTagGoal,
);

export const NpmKubernetesDeployGoals = new Goals(
    "Node.js Kubernetes Deploy",
    VersionGoal,
    ReviewGoal,
    AutofixGoal,
    NpmBuildGoal,
    NpmPublishGoal,
    DockerBuildGoal,
    NpmTagGoal,
    StagingDockerDeploymentGoal,
    ProductionDockerDeploymentGoal,
);
