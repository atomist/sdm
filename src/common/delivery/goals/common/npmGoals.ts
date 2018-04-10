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
<<<<<<< HEAD
    ArtifactGoal,
    AutofixGoal,
    BuildGoal,
    DockerBuildGoal,
    ReviewGoal,
    StagingDeploymentGoal,
    StagingEndpointGoal,
    TagGoal,
    VersionGoal,
=======
    ArtifactGoal, AutofixGoal, BuildGoal, DockerBuildGoal, ReviewGoal, StagingDeploymentGoal,
    StagingEndpointGoal
>>>>>>> Docker bits and pieces
} from "./commonGoals";

export const NpmBuildGoals = new Goals(
    "npm build",
    ReviewGoal,
    AutofixGoal,
    BuildGoal,
);

export const NpmDeployGoals = new Goals(
    "npm deploy",
    ReviewGoal,
    AutofixGoal,
    BuildGoal,
    ArtifactGoal,
    StagingDeploymentGoal,
    StagingEndpointGoal,
);

export const NpmDockerGoals = new Goals(
    "npm docker",
<<<<<<< HEAD
    VersionGoal,
=======
>>>>>>> Docker bits and pieces
    ReviewGoal,
    AutofixGoal,
    BuildGoal,
    DockerBuildGoal,
<<<<<<< HEAD
    TagGoal,
=======
>>>>>>> Docker bits and pieces
);
