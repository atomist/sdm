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

import { logger } from "@atomist/automation-client";
import { DeploySpec, executeDeploy, retryDeployFromLocal } from "../../../handlers/events/delivery/deploy/executeDeploy";
import { executableJarDeployer } from "../../../handlers/events/delivery/deploy/local/jar/executableJarDeployer";
import { StartupInfo } from "../../../handlers/events/delivery/deploy/local/LocalDeployerOptions";
import { mavenDeployer } from "../../../handlers/events/delivery/deploy/local/maven/mavenSourceDeployer";
import { StagingDeploymentGoal, StagingEndpointGoal } from "../../../handlers/events/delivery/goals/httpServiceGoals";
import { OnSupersededStatus } from "../../../handlers/events/delivery/superseded/OnSuperseded";
import { SourceDeployer } from "../../../spi/deploy/SourceDeployer";
import { artifactStore } from "../artifactStore";
import { ExecuteGoalOnSuccessStatus } from "../../../handlers/events/delivery/deploy/ExecuteGoalOnSuccessStatus";
import {
    ManagedDeploymentTargeter,
    ManagedDeploymentTargetInfo,
    targetInfoForAllBranches
} from "../../../handlers/events/delivery/deploy/local/appManagement";
import { Deployer, FunctionalUnit } from "../../../";

/**
 * Deploy to the automation client node
 */


const LocalExecutableJarDeploySpec: DeploySpec<ManagedDeploymentTargetInfo> = {
    deployGoal: StagingDeploymentGoal,
    endpointGoal: StagingEndpointGoal,
    artifactStore,
    deployer: executableJarDeployer({
        baseUrl: "http://localhost",
        lowerPort: 8082,
        commandLineArgumentsFor: springBootExecutableJarArgs,
    }),
    targeter: ManagedDeploymentTargeter,
};

const UndeployOnSuperseded = new OnSupersededStatus(inv => {
    logger.info("Will undeploy application %j", inv.id);
    return LocalExecutableJarDeploySpec.deployer.undeploy(targetInfoForAllBranches(inv.id));
});

export const LocalExecutableJarDeploy: FunctionalUnit = {
    eventHandlers: [
        () => new ExecuteGoalOnSuccessStatus("DeployFromLocalExecutableJar",
            LocalExecutableJarDeploySpec.deployGoal,
            executeDeploy(LocalExecutableJarDeploySpec)),
        () => UndeployOnSuperseded],
    commandHandlers: [() => retryDeployFromLocal("DeployFromLocalExecutableJar",
        LocalExecutableJarDeploySpec)],
};

function springBootExecutableJarArgs(si: StartupInfo): string[] {
    return [
        `--server.port=${si.port}`,
        `--server.contextPath=${si.contextRoot}`,
    ];
}

export const MavenDeployer: Deployer =
    mavenDeployer({
        baseUrl: "http://localhost",
        lowerPort: 9090,
        commandLineArgumentsFor: springBootMavenArgs,
    });

function springBootMavenArgs(si: StartupInfo): string[] {
    return [
        `-Dserver.port=${si.port}`,
        `-Dserver.contextPath=${si.contextRoot}`,
    ];
}
