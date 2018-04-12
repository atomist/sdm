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
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { spawn } from "child_process";
import { DeployableArtifact } from "../../../../../spi/artifact/ArtifactStore";
import { Deployer } from "../../../../../spi/deploy/Deployer";
import { Deployment } from "../../../../../spi/deploy/Deployment";
import { ProgressLog } from "../../../../../spi/log/ProgressLog";
import { lastLinesLogInterpreter } from "../../../goals/support/logInterpreters";
import { ManagedDeployments, ManagedDeploymentTargetInfo } from "../appManagement";
import { DefaultLocalDeployerOptions, LocalDeployerOptions, StartupInfo } from "../LocalDeployerOptions";

/**
 * Managed deployments
 */
export let managedExecutableJarDeployments: ManagedDeployments;

/**
 * Start up an executable Jar on the same node as the automation client.
 * Not intended as a Paas, but for use during demos and development.
 * @param opts options
 */
export function executableJarDeployer(opts: LocalDeployerOptions): Deployer<ManagedDeploymentTargetInfo> {
    if (!managedExecutableJarDeployments) {
        logger.info("Created new deployments record");
        managedExecutableJarDeployments = new ManagedDeployments(opts.lowerPort);
    }
    return new ExecutableJarDeployer({
        ...DefaultLocalDeployerOptions,
        ...opts,
    });
}

class ExecutableJarDeployer implements Deployer<ManagedDeploymentTargetInfo, Deployment> {

    constructor(public opts: LocalDeployerOptions) {
    }

    public async findDeployments(id: RemoteRepoRef,
                                 ti: ManagedDeploymentTargetInfo,
                                 creds: ProjectOperationCredentials) {
        const thisDeployment = this.deploymentFor(ti);
        return thisDeployment ? [thisDeployment] : [];
    }

    public async undeploy(id: ManagedDeploymentTargetInfo, deployment: Deployment, log: ProgressLog): Promise<any> {
        return managedExecutableJarDeployments.terminateIfRunning(id.managedDeploymentKey);
    }

    private deploymentFor(ti: ManagedDeploymentTargetInfo): Deployment {
        const managed = managedExecutableJarDeployments.findDeployment(ti.managedDeploymentKey);
        if (!managed) {
            return undefined;
        }
        const port = managed.port;
        const baseUrl = this.opts.baseUrl;
        return {
            endpoint: `${baseUrl}:${port}/${this.contextRoot(ti.managedDeploymentKey)}`,
        };
    }

    private contextRoot(id: RemoteRepoRef) {
        return `/${id.owner}/${id.repo}/staging`;
    }

    public async deploy(da: DeployableArtifact,
                        ti: ManagedDeploymentTargetInfo,
                        log: ProgressLog,
                        credentials: ProjectOperationCredentials,
                        atomistTeam: string): Promise<Deployment[]> {
        if (!da.filename) {
            throw new Error("No filename in deployable artifact!");
        }
        const port = await managedExecutableJarDeployments.findPort(ti.managedDeploymentKey, this.opts.baseUrl);
        logger.info("Deploying app [%j] on port [%d] for team %s", da, port, atomistTeam);
        const startupInfo: StartupInfo = {
            port,
            atomistTeam,
            contextRoot: this.contextRoot(da.id),
        };
        await managedExecutableJarDeployments.terminateIfRunning(ti.managedDeploymentKey);
        // TODO switch to watchSpawned
        const childProcess = spawn("java",
            [
                "-jar",
                da.filename,
            ].concat(this.opts.commandLineArgumentsFor(startupInfo)),
            {
                cwd: da.cwd,
            });
        childProcess.stdout.on("data", what => log.write(what.toString()));
        childProcess.stderr.on("data", what => log.write(what.toString()));
        return [await new Promise<Deployment>((resolve, reject) => {
            childProcess.stdout.addListener("data", async what => {
                // TODO too Tomcat specific
                if (!!what && what.toString().includes("Tomcat started on port")) {
                    const deployment = {
                        endpoint: `${this.opts.baseUrl}:${port}/${this.contextRoot(ti.managedDeploymentKey)}`,
                    };
                    managedExecutableJarDeployments.recordDeployment({id: ti.managedDeploymentKey, port, childProcess, deployment});
                    resolve(deployment);
                }
            });
            childProcess.addListener("exit", () => {
                reject(new Error("ExecutableJarDeployer: We should have found Tomcat endpoint by now!!"));
            });
            childProcess.addListener("error", reject);
        })];
    }

    public logInterpreter = lastLinesLogInterpreter("Executable jar deployment");
}
