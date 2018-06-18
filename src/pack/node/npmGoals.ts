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

import { GoalWithPrecondition } from "../../api/goal/Goal";
import { Goals } from "../../api/goal/Goals";
import { IndependentOfEnvironment, ProductionEnvironment, StagingEnvironment } from "../../api/goal/support/environment";
import { ArtifactGoal, AutofixGoal, BuildGoal, ReviewGoal, StagingEndpointGoal } from "../../api/machine/wellKnownGoals";
import { StagingDeploymentGoal } from "../../api/machine/wellKnownGoals";
import { DockerBuildGoal, TagGoal, VersionGoal } from "../well-known-goals/commonGoals";

export const NpmPublishGoal = new GoalWithPrecondition({
    uniqueName: "Publish",
    environment: IndependentOfEnvironment,
    orderedName: "2-publish",
    displayName: "publish",
    workingDescription: "Publishing...",
    completedDescription: "Published",
    failedDescription: "Published failed",
    isolated: true,
}, BuildGoal);

export const StagingDockerDeploymentGoal = new GoalWithPrecondition({
    uniqueName: "DeployToTest",
    environment: StagingEnvironment,
    orderedName: "3-deploy",
    displayName: "deploy to Test",
    completedDescription: "Deployed to Test",
    failedDescription: "Test deployment failure",
    waitingForApprovalDescription: "Promote to Prod",
    approvalRequired: true,
}, DockerBuildGoal);

export const ProductionDockerDeploymentGoal = new GoalWithPrecondition({
    uniqueName: "DeployToProduction",
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
    BuildGoal,
    NpmPublishGoal,
    TagGoal,
);

export const NpmDockerGoals = new Goals(
    "Node.js Docker Build",
    VersionGoal,
    ReviewGoal,
    AutofixGoal,
    BuildGoal,
    NpmPublishGoal,
    DockerBuildGoal,
    TagGoal,
);

export const NpmKubernetesDeployGoals = new Goals(
    "Node.js Kubernetes Build and Deploy",
    VersionGoal,
    ReviewGoal,
    AutofixGoal,
    BuildGoal,
    NpmPublishGoal,
    DockerBuildGoal,
    TagGoal,
    StagingDockerDeploymentGoal,
    ProductionDockerDeploymentGoal,
);
