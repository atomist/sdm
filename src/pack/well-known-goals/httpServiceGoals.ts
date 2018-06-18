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

import { Goals } from "../../api/goal/Goals";
import {
    ArtifactGoal,
    AutofixGoal,
    BuildGoal, DeleteAfterUndeploysGoal, DeleteRepositoryGoal,
    FingerprintGoal, LocalDeploymentGoal, ProductionDeploymentGoal, ProductionEndpointGoal,
    ProductionUndeploymentGoal,
    PushReactionGoal, ReviewGoal,
    StagingDeploymentGoal, StagingEndpointGoal, StagingVerifiedGoal,
} from "../../api/machine/wellKnownGoals";
import {
    LocalEndpointGoal, LocalUndeploymentGoal,
    StagingUndeploymentGoal,
} from "./commonGoals";

/**
 * Goals for an Http service, mirroring a typical flow through
 * staging to production.
 * Goal sets are normally user defined, so this is largely
 * an illustration.
 * @type {Goals}
 */
export const HttpServiceGoals = new Goals(
    "HTTP Service",
    FingerprintGoal,
    AutofixGoal,
    ReviewGoal,
    PushReactionGoal,
    BuildGoal,
    ArtifactGoal,
    StagingDeploymentGoal,
    StagingEndpointGoal,
    StagingVerifiedGoal,
    ProductionDeploymentGoal,
    ProductionEndpointGoal);

export const LocalDeploymentGoals = new Goals(
    "Local Deployment",
    PushReactionGoal,
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
