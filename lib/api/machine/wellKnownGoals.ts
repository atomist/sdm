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
} from "../goal/Goal";
import {
    IndependentOfEnvironment,
    ProductionEnvironment,
    ProjectDisposalEnvironment,
    StagingEnvironment,
} from "../goal/support/environment";

/**
 * Goals referenced in SoftwareDeliveryMachine methods such addPushImpactListener
 */

export const NoGoal = new Goal({
    uniqueName: "nevermind",
    displayName: "immaterial",
    environment: IndependentOfEnvironment,
    completedDescription: "No material changes",
});

/**
 * Special goal that locks a goal set so no further goals
 * can be added. This goal is never actually emitted.
 * @type {Goal}
 */
export const LockingGoal = new Goal({
    uniqueName: "lock",
    displayName: "lock",
    completedDescription: "Lock goals",
    environment: IndependentOfEnvironment,
});

/**
 * Goal that performs fingerprinting. Typically invoked
 * early in a delivery flow.
 * @type {Goal}
 * @deprecated Use Fingerprint typed goal
 */
export const FingerprintGoal = new Goal({
    uniqueName: "fingerprint",
    displayName: "fingerprint",
    environment: IndependentOfEnvironment,
    workingDescription: "Running fingerprint calculations",
    completedDescription: "Fingerprinted",
});

/**
 * Goal that performs autofixes: For example, linting
 * and adding license headers.
 * @type {Goal}
 */
export const AutofixGoal = new Goal({
    uniqueName: "autofix",
    displayName: "autofix",
    environment: IndependentOfEnvironment,
    workingDescription: "Applying autofixes",
    completedDescription: "No autofixes applied",
    failedDescription: "Autofixes failed",
    stoppedDescription: "Autofixes applied",
    isolated: true,
});

/**
 * Goal to run code inspections
 * @type {Goal}
 */
export const CodeInspectionGoal = new Goal({
    uniqueName: "code-inspection",
    displayName: "code inspection",
    environment: IndependentOfEnvironment,
    workingDescription: "Running code inspections",
    completedDescription: "Code inspections passed",
});

/**
 * Goal that runs PushReactionRegistrations
 * @type {Goal}
 */
export const PushReactionGoal = new Goal({
    uniqueName: "code-reaction",
    displayName: "code reaction",
    environment: IndependentOfEnvironment,
    workingDescription: "Running code reactions",
    completedDescription: "Code reactions passed",
});

/**
 * Just build, without any checks
 * @type {Goal}
 */
export const JustBuildGoal = new Goal({
    uniqueName: "just-build",
    environment: IndependentOfEnvironment,
    displayName: "build",
    workingDescription: "Building",
    completedDescription: "Build successful",
    failedDescription: "Build failed",
    retryFeasible: true,
});

export const BuildGoal = new GoalWithPrecondition({
    uniqueName: "build",
    environment: IndependentOfEnvironment,
    displayName: "build",
    workingDescription: "Building",
    completedDescription: "Build successful",
    failedDescription: "Build failed",
    isolated: true,
    retryFeasible: true,
}, AutofixGoal);

// This one is actually satisfied in an ImageLinked event,
// which happens to be a result of the build.
export const ArtifactGoal = new GoalWithPrecondition({
    uniqueName: "artifact",
    environment: IndependentOfEnvironment,
    displayName: "store artifact",
    completedDescription: "Stored artifact",
}, BuildGoal);

export const LocalDeploymentGoal = new Goal({
    uniqueName: "deploy-locally",
    displayName: "deploy locally",
    environment: IndependentOfEnvironment,
    completedDescription: "Deployed locally",
});

export const StagingDeploymentGoal = new GoalWithPrecondition({
    uniqueName: "deploy-to-test",
    environment: StagingEnvironment,
    displayName: "deploy to Test",
    completedDescription: "Deployed to Test",
    failedDescription: "Test deployment failure",
}, ArtifactGoal);

// this one won't be set up to trigger on its precondition;
// rather, the deploy goal also sets this one, currently.
// Setting the precondition lets FailDownstream know that this
// one is never gonna succeed if the deploy failed.
export const StagingEndpointGoal = new GoalWithPrecondition({
    uniqueName: "find-test-endpoint",
    environment: StagingEnvironment,
    displayName: "locate service endpoint in Test",
    completedDescription: "Here is the service endpoint in Test",
    failedDescription: "Couldn't locate service endpoint in Test",
}, StagingDeploymentGoal);

export const StagingVerifiedGoal = new GoalWithPrecondition({
    uniqueName: "verify-test",
    environment: StagingEnvironment,
    displayName: "verify Test deployment",
    completedDescription: "Verified endpoint in Test",
    waitingForApprovalDescription: "Test endpoint verified! Approve for production deploy.",
}, StagingEndpointGoal);

export const ProductionDeploymentGoal = new GoalWithPrecondition({
    uniqueName: "deploy-to-production",
    environment: ProductionEnvironment,
    displayName: "deploy to Prod",
    completedDescription: "Deployed to Prod",
},
ArtifactGoal, StagingVerifiedGoal);

// this one won't be set up to trigger on its precondition;
// rather, the deploy goal also sets this one, currently.
// Setting the precondition lets FailDownstream know that this
// one is never gonna succeed if the deploy failed.
export const ProductionEndpointGoal = new GoalWithPrecondition({
    uniqueName: "find-production-endpoint",
    environment: ProductionEnvironment,
    displayName: "locate service endpoint in Prod",
    completedDescription: "Here is the service endpoint in Prod",
}, ProductionDeploymentGoal);

export const ProductionUndeploymentGoal = new Goal({
    uniqueName: "undeploy-from-production",
    environment: ProjectDisposalEnvironment,
    displayName: "undeploy from Prod",
    completedDescription: "not deployed in Prod",
});

export const DeleteAfterUndeploysGoal = new GoalWithPrecondition({
    uniqueName: "delete-repository-after-undeployed",
    displayName: "delete repository after undeploy",
    environment: ProjectDisposalEnvironment,
    completedDescription: "Repository deleted",
}, ProductionUndeploymentGoal);

export const DeleteRepositoryGoal = new Goal({
    uniqueName: "delete-repository",
    displayName: "delete repository",
    environment: ProjectDisposalEnvironment,
    completedDescription: "Offered to delete repository",
});
