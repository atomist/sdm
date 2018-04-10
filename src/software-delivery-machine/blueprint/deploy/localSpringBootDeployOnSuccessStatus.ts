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

import { logger } from "@atomist/automation-client";
import { FunctionalUnit } from "../../../blueprint/FunctionalUnit";
import { DeploySpec } from "../../../common/delivery/deploy/executeDeploy";
import {
    ManagedDeploymentTargeter,
    ManagedDeploymentTargetInfo,
    targetInfoForAllBranches,
} from "../../../common/delivery/deploy/local/appManagement";
import { executableJarDeployer } from "../../../common/delivery/deploy/local/jar/executableJarDeployer";
import { StartupInfo } from "../../../common/delivery/deploy/local/LocalDeployerOptions";
import { mavenDeployer } from "../../../common/delivery/deploy/local/maven/mavenSourceDeployer";
import {
    StagingDeploymentGoal,
    StagingEndpointGoal,
    StagingUndeploymentGoal,
} from "../../../common/delivery/goals/common/commonGoals";
import { ProjectLoader } from "../../../common/repo/ProjectLoader";
import { OnSupersededStatus } from "../../../handlers/events/delivery/superseded/OnSuperseded";
import { Deployer } from "../../../spi/deploy/Deployer";
import { DefaultArtifactStore } from "../artifactStore";

export const LocalExecutableJarDeployer: Deployer<ManagedDeploymentTargetInfo> = executableJarDeployer({
    baseUrl: "http://localhost",
    lowerPort: 8082,
    commandLineArgumentsFor: springBootExecutableJarArgs,
});

/**
 * Deploy to the automation client node
 */

const LocalExecutableJarDeploySpec: DeploySpec<ManagedDeploymentTargetInfo> = {
    implementationName: "DeployFromLocalExecutableJar",
    deployGoal: StagingDeploymentGoal,
    endpointGoal: StagingEndpointGoal,
    artifactStore: DefaultArtifactStore,
    deployer: LocalExecutableJarDeployer,
    targeter: ManagedDeploymentTargeter,
    undeploy: {
        goal: StagingUndeploymentGoal,
        implementationName: "UndeployFromLocalJar",
    },
};

const UndeployOnSuperseded = new OnSupersededStatus(inv => {
    logger.info("Will undeploy application %j", inv.id);
    return LocalExecutableJarDeploySpec.deployer.undeploy(targetInfoForAllBranches(inv.id), undefined, undefined);
});

/* tslint:disable:no-unused-variable */

const undeployLocalOnSuperseded: FunctionalUnit = {eventHandlers: [() => UndeployOnSuperseded], commandHandlers: []};

function springBootExecutableJarArgs(si: StartupInfo): string[] {
    return [
        `--server.port=${si.port}`,
        `--server.contextPath=${si.contextRoot}`,
    ];
}

export function mavenSourceDeployer(projectLoader: ProjectLoader): Deployer<ManagedDeploymentTargetInfo> {
    return mavenDeployer(projectLoader, {
        baseUrl: "http://localhost",
        lowerPort: 9090,
        commandLineArgumentsFor: springBootMavenArgs,
    });
}

function springBootMavenArgs(si: StartupInfo): string[] {
    return [
        `-Dserver.port=${si.port}`,
        `-Dserver.contextPath=${si.contextRoot}`,
    ];
}
