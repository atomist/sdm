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
    TagGoal,
    VersionGoal,
} from "./commonGoals";

export const NpmBuildGoals = new Goals(
    "Node.js Build",
    ReviewGoal,
    AutofixGoal,
    BuildGoal,
);

export const NpmDeployGoals = new Goals(
    "Node.js Deploy",
    ReviewGoal,
    AutofixGoal,
    BuildGoal,
    ArtifactGoal,
    StagingDeploymentGoal,
    StagingEndpointGoal,
);

export const NpmDockerGoals = new Goals(
    "Node.js Docker Build",
    VersionGoal,
    ReviewGoal,
    AutofixGoal,
    BuildGoal,
    DockerBuildGoal,
    TagGoal,
);

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

export const NpmKubernetesDeployGoals = new Goals(
    "Node.js Kubernetes Deploy",
    VersionGoal,
    ReviewGoal,
    AutofixGoal,
    BuildGoal,
    DockerBuildGoal,
    TagGoal,
    StagingDockerDeploymentGoal,
    ProductionDockerDeploymentGoal,
);
