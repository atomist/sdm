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
    ProductionEnvironment, ProjectDisposalEnvironment,
    StagingEnvironment,
} from "../gitHubContext";
import {
    Goal,
    GoalWithPrecondition,
} from "../Goal";
import { Goals } from "../Goals";

export const FingerprintGoal = new Goal({
    uniqueCamelCaseName: "Fingerprint",
    environment: IndependentOfEnvironment,
    orderedName: "0.1-fingerprint",
    completedDescription: "Fingerprinted",
});

export const AutofixGoal = new Goal({
    uniqueCamelCaseName: "Autofix",
    environment: IndependentOfEnvironment,
    orderedName: "0.2-autofix",
    workingDescription: "Running autofixes...",
    completedDescription: "Autofixed",
    failedDescription: "Fixes made: Don't proceed",
});

export const ReviewGoal = new Goal({
    uniqueCamelCaseName: "Review",
    environment: IndependentOfEnvironment,
    orderedName: "1-review",
    workingDescription: "Running code reviews...",
    completedDescription: "Code review passed",
    waitingForApprovalDescription: "Manual approval needed",
});

export const CodeReactionGoal = new Goal({
    uniqueCamelCaseName: "CodeReaction",
    environment: IndependentOfEnvironment,
    orderedName: "1.5-react",
    workingDescription: "Running code reactions...",
    completedDescription: "Code reactions passed",
});

export const VersionGoal = new Goal({
    uniqueCamelCaseName: "Version",
    environment: IndependentOfEnvironment,
    orderedName: "0.1-version",
    workingDescription: "Calculating project version...",
    completedDescription: "Versioned",
});

/**
 * Just build, without any checks
 * @type {Goal}
 */
export const JustBuildGoal = new Goal({
    uniqueCamelCaseName: "JustBuild",
    environment: IndependentOfEnvironment,
    orderedName: "2-just-build ",
    displayName: "build",
    workingDescription: "Building...",
    completedDescription: "Build successful",
    failedDescription: "Build failed",
});

export const BuildGoal = new GoalWithPrecondition({
    uniqueCamelCaseName: "Build",
    environment: IndependentOfEnvironment,
    orderedName: "2-build",
    displayName: "build",
    workingDescription: "Building...",
    completedDescription: "Build successful",
    failedDescription: "Build failed",
}, AutofixGoal);

export const DockerBuildGoal = new GoalWithPrecondition({
    uniqueCamelCaseName: "DockerBuild",
    environment: IndependentOfEnvironment,
    orderedName: "3-docker",
    displayName: "docker build",
    workingDescription: "Running Docker build...",
    completedDescription: "Docker build successful",
    failedDescription: "Failed to build Docker image",
}, BuildGoal);

export const TagGoal = new GoalWithPrecondition({
    uniqueCamelCaseName: "Tag",
    environment: IndependentOfEnvironment,
    orderedName: "4-tag",
    displayName: "tag",
    workingDescription: "Tagging...",
    completedDescription: "Tagged",
    failedDescription: "Failed to create Tag",
}, DockerBuildGoal, BuildGoal);

// This one is actually satisfied in an ImageLinked event,
// which happens to be a result of the build.
export const ArtifactGoal = new GoalWithPrecondition({
    uniqueCamelCaseName: "Artifact",
    environment: IndependentOfEnvironment,
    orderedName: "2.5-artifact",
    displayName: "store artifact",
    completedDescription: "Stored artifact",
}, BuildGoal);

export const StagingDeploymentGoal = new GoalWithPrecondition({
    uniqueCamelCaseName: "DeployToTest",
    environment: StagingEnvironment,
    orderedName: "3-deploy",
    displayName: "deploy to Test",
    completedDescription: "Deployed to Test",
    failedDescription: "Test deployment failure",
}, ArtifactGoal);

export const StagingUndeploymentGoal = new Goal({
    uniqueCamelCaseName: "UndeployFromTest",
    environment: ProjectDisposalEnvironment,
    orderedName: "2-staging-undeploy",
    displayName: "undeploy from test",
    completedDescription: "not deployed in test",
});

// this one won't be set up to trigger on its precondition;
// rather, the deploy goal also sets this one, currently.
// Setting the precondition lets FailDownstream know that this
// one is never gonna succeed if the deploy failed.
export const StagingEndpointGoal = new GoalWithPrecondition({
    uniqueCamelCaseName: "FindTestEndpoint",
    environment: StagingEnvironment,
    orderedName: "4-endpoint",
    displayName: "locate service endpoint in Test",
    completedDescription: "Here is the service endpoint in Test",
    failedDescription: "Couldn't locate service endpoint in Test",
}, StagingDeploymentGoal);

export const StagingVerifiedGoal = new GoalWithPrecondition({
    uniqueCamelCaseName: "VerifyTest",
    environment: StagingEnvironment,
    orderedName: "5-verifyEndpoint",
    displayName: "verify Test deployment",
    completedDescription: "Verified endpoint in Test",
    waitingForApprovalDescription: "Test endpoint verified! Approve for production deploy.",
}, StagingEndpointGoal);

export const ProductionDeploymentGoal = new GoalWithPrecondition({
        uniqueCamelCaseName: "DeployToProduction",
        environment: ProductionEnvironment,
        orderedName: "3-prod-deploy",
        displayName: "deploy to Prod",
        completedDescription: "Deployed to Prod",
    },
    ArtifactGoal, StagingVerifiedGoal);

export const ProductionUndeploymentGoal = new Goal({
    uniqueCamelCaseName: "UndeployFromProduction",
    environment: ProjectDisposalEnvironment,
    orderedName: "3-prod-undeploy",
    displayName: "undeploy from Prod",
    completedDescription: "not deployed in Prod",
});

// this one won't be set up to trigger on its precondition;
// rather, the deploy goal also sets this one, currently.
// Setting the precondition lets FailDownstream know that this
// one is never gonna succeed if the deploy failed.
export const ProductionEndpointGoal = new GoalWithPrecondition({
    uniqueCamelCaseName: "FindProductionEndpoint",
    environment: ProductionEnvironment,
    orderedName: "4-endpoint",
    displayName: "locate service endpoint in Prod",
    completedDescription: "Here is the service endpoint in Prod",
}, ProductionDeploymentGoal);

export const LocalDeploymentGoal = new Goal({
    uniqueCamelCaseName: "DeployHere",
    environment: IndependentOfEnvironment,
    orderedName: "1-deploy-locally",
    completedDescription: "Deployed locally",
});

export const LocalUndeploymentGoal = new Goal({
    uniqueCamelCaseName: "UndeployHere",
    environment: ProjectDisposalEnvironment,
    orderedName: "1-undeploy-locally",
    failedDescription: "Failed at local undeploy",
    completedDescription: "not deployed locally",
});

export const DeleteRepositoryGoal = new Goal({
    uniqueCamelCaseName: "DeleteRepository",
    environment: ProjectDisposalEnvironment,
    orderedName: "8-delete-repo",
    completedDescription: "Offered to delete repository",
});

export const DeleteAfterUndeploysGoal = new GoalWithPrecondition({
    uniqueCamelCaseName: "DeleteRepositoryAfterUndeployed",
    environment: ProjectDisposalEnvironment,
    orderedName: "8-delete-repo",
    completedDescription: "Repository deleted",
}, ProductionUndeploymentGoal);

// not an enforced precondition, but it's real enough to graph
export const LocalEndpointGoal = new GoalWithPrecondition({
    uniqueCamelCaseName: "FindLocalEndpoint",
    environment: IndependentOfEnvironment,
    orderedName: "2-endpoint",
    displayName: "locate local service endpoint",
    completedDescription: "Here is the local service endpoint",

}, LocalDeploymentGoal);

export const NoGoal = new Goal({
    uniqueCamelCaseName: "Nevermind",
    environment: IndependentOfEnvironment,
    orderedName: "1-immaterial",
    displayName: "immaterial",
    completedDescription: "No material changes",
});

export const StagingDeploymentContext = StagingDeploymentGoal.context;
export const StagingEndpointContext = StagingEndpointGoal.context;
export const StagingVerifiedContext = StagingVerifiedGoal.context;
export const ProductionDeploymentContext = ProductionDeploymentGoal.context;
export const ProductionEndpointContext = ProductionEndpointGoal.context;
export const ReviewContext = ReviewGoal.context;
export const BuildContext = BuildGoal.context;

export const ProductionMauve = "#cf5097";

/**
 * Special Goals object to be returned if changes are immaterial.
 * The identity of this object is important.
 * @type {Goals}
 */
export const NoGoals = new Goals(
    "No action needed",
    NoGoal);
