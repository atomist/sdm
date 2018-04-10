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

import { Goals } from "../Goals";
import {
    ArtifactGoal, AutofixGoal, BuildGoal, CodeReactionGoal, DeleteAfterUndeploysGoal, DeleteRepositoryGoal, FingerprintGoal, LocalDeploymentGoal,
    LocalEndpointGoal,
    LocalUndeploymentGoal,
    ProductionDeploymentGoal,
    ProductionEndpointGoal, ProductionUndeploymentGoal, ReviewGoal,
    StagingDeploymentGoal, StagingEndpointGoal, StagingUndeploymentGoal, StagingVerifiedGoal,
} from "./commonGoals";

/**
 * Goals for an Http service
 * @type {Goals}
 */
export const HttpServiceGoals = new Goals(
    "HTTP Service",
    FingerprintGoal,
    AutofixGoal,
    ReviewGoal,
    CodeReactionGoal,
    BuildGoal,
    ArtifactGoal,
    StagingDeploymentGoal,
    StagingEndpointGoal,
    StagingVerifiedGoal,
    ProductionDeploymentGoal,
    ProductionEndpointGoal);

export const LocalDeploymentGoals = new Goals(
    "Local Deployment",
    CodeReactionGoal,
    LocalDeploymentGoal,
    LocalEndpointGoal);

export const UndeployEverywhereGoals = new Goals(
    "Undeploy all environments",
    LocalUndeploymentGoal,
    StagingUndeploymentGoal,
    ProductionUndeploymentGoal,
    DeleteAfterUndeploysGoal,
);

export const RepositoryDeletionGoals = new Goals(
    "Offer to delete repository",
    DeleteRepositoryGoal,
);
