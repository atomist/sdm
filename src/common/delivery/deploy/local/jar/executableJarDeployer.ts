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
import { spawn } from "child_process";
import { DeployableArtifact } from "../../../../../spi/artifact/ArtifactStore";
import { ArtifactDeployer } from "../../../../../spi/deploy/ArtifactDeployer";
import { Deployment } from "../../../../../spi/deploy/Deployment";
import { InterpretedLog } from "../../../../../spi/log/InterpretedLog";
import { ProgressLog } from "../../../../../spi/log/ProgressLog";
import { ManagedDeployments, ManagedDeploymentTargetInfo } from "../appManagement";
import { DefaultLocalDeployerOptions, LocalDeployerOptions, StartupInfo } from "../LocalDeployerOptions";

/**
 * Managed deployments
 */
let managedDeployments: ManagedDeployments;

/**
 * Start up an executable Jar on the same node as the automation client.
 * Not intended as a Paas, but for use during demos and development.
 * @param opts options
 */
export function executableJarDeployer(opts: LocalDeployerOptions): ArtifactDeployer<ManagedDeploymentTargetInfo> {
    if (!managedDeployments) {
        logger.info("Created new deployments record");
        managedDeployments = new ManagedDeployments(opts.lowerPort);
    }
    return new ExecutableJarDeployer({
        ...DefaultLocalDeployerOptions,
        ...opts,
    });
}

class ExecutableJarDeployer implements ArtifactDeployer<ManagedDeploymentTargetInfo> {

    constructor(public opts: LocalDeployerOptions) {
    }

    public async undeploy(id: ManagedDeploymentTargetInfo): Promise<any> {
        return managedDeployments.terminateIfRunning(id.managedDeploymentKey);
    }

    public async deploy(da: DeployableArtifact,
                        ti: ManagedDeploymentTargetInfo,
                        log: ProgressLog,
                        credentials: ProjectOperationCredentials,
                        atomistTeam: string): Promise<Array<Promise<Deployment>>> {
        const baseUrl = this.opts.baseUrl;
        const port = managedDeployments.findPort(ti.managedDeploymentKey);
        logger.info("Deploying app [%j] on port [%d] for team %s", da, port, atomistTeam);
        const startupInfo: StartupInfo = {
            port,
            atomistTeam,
            contextRoot: `/${da.id.owner}/${da.id.repo}/staging`,
        };
        await managedDeployments.terminateIfRunning(ti.managedDeploymentKey);
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
        return [new Promise((resolve, reject) => {
            childProcess.stdout.addListener("data", what => {
                // TODO too Tomcat specific
                if (!!what && what.toString().includes("Tomcat started on port")) {
                    managedDeployments.recordDeployment({id: ti.managedDeploymentKey, port, childProcess});
                    resolve({
                        endpoint: `${baseUrl}:${port}/${startupInfo.contextRoot}`,
                    });
                }
            });
            childProcess.addListener("exit", () => {
                reject("We should have found Tomcat endpoint by now!!");
            });
            childProcess.addListener("error", reject);
        })];
    }

    public logInterpreter(log: string): InterpretedLog | undefined {
        if (!log) {
            logger.warn("log was empty");
            return undefined;
        }

        const maybeFailedToStart = appFailedToStart(log);
        if (maybeFailedToStart) {
            return {
                relevantPart: maybeFailedToStart,
                message: "Application failed to start",
                includeFullLog: false,
            };
        }

        // default to maven errors
        const maybeMavenErrors = mavenErrors(log);
        if (maybeMavenErrors) {
            logger.info("recognized maven error");
            return {
                relevantPart: maybeMavenErrors,
                message: "Maven errors",
                includeFullLog: true,
            };
        }

        // or it could be this problem here
        if (log.match(/Error checking out artifact/)) {
            logger.info("Recognized artifact error");
            return {
                relevantPart: log,
                message: "I lost the local cache. Please rebuild",
                includeFullLog: false,
            };
        }

        logger.info("Did not find anything to recognize in the log");
    }

}

function appFailedToStart(log: string) {
    const lines = log.split("\n");
    const failedToStartLine = lines.indexOf("APPLICATION FAILED TO START");
    if (failedToStartLine < 1) {
        return undefined;
    }
    const likelyLines = lines.slice(failedToStartLine + 3, failedToStartLine + 10);
    return likelyLines.join("\n");
}

function mavenErrors(log: string) {
    if (log.match(/^\[ERROR]/m)) {
        return log.split("\n")
            .filter(l => l.startsWith("[ERROR]"))
            .join("\n");
    }
}
