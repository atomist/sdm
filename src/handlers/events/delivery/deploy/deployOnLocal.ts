/*
 * Copyright © 2017 Atomist, Inc.
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
    EventFired,
    EventHandler,
    failure,
    Failure,
    GraphQL,
    HandleEvent,
    HandlerContext,
    HandlerResult,
    logger,
    Secret,
    Secrets,
    Success,
} from "@atomist/automation-client";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { Goal, Goals } from "../../../../common/goals/Goal";
import { ConsoleProgressLog } from "../../../../common/log/progressLogs";
import { addressChannelsFor } from "../../../../common/slack/addressChannels";
import { SourceDeployer } from "../../../../spi/deploy/SourceDeployer";
import { OnPendingLocalDeployStatus } from "../../../../typings/types";
import {
    setDeployStatus,
    setEndpointStatus,
} from "./deploy";
import { ExecuteGoalInvocation, Executor, StatusForExecuteGoal } from "./ExecuteGoalOnSuccessStatus";
import { MavenDeployer } from "../../../../software-delivery-machine/blueprint/deploy/localSpringBootDeployOnSuccessStatus";
import { LocalDeploymentGoal, LocalEndpointGoal } from "../goals/httpServiceGoals";
import { FunctionalUnit } from "../../../../index";
import { ExecuteGoalOnPendingStatus } from "../build/ExecuteGoalOnPendingStatus";
import { executeDeploy, retryDeployFromLocal } from "./executeDeploy";
import { CloningArtifactStore } from "./local/maven/mavenSourceDeployer";
import { ManagedDeploymentTargeter } from "./local/appManagement";

const LocalDeployFromCloneSpec =
    {
        deployGoal: LocalDeploymentGoal,
        endpointGoal: LocalEndpointGoal,
        artifactStore: new CloningArtifactStore(),
        deployer: MavenDeployer,
        targeter: ManagedDeploymentTargeter
    };

export const LocalDeployment: FunctionalUnit = {
    eventHandlers: [
        () => new ExecuteGoalOnPendingStatus("LocalDeployFromClone",
            LocalDeploymentGoal,
            executeDeploy(LocalDeployFromCloneSpec)),
    ],
    commandHandlers: [() => retryDeployFromLocal("LocalDeployFromClone", LocalDeployFromCloneSpec)],
};