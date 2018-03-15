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
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { spawn } from "child_process";
import { Deployment } from "../../../../../../spi/deploy/Deployment";
import { SourceDeployer } from "../../../../../../spi/deploy/SourceDeployer";
import { InterpretedLog, LogInterpreter } from "../../../../../../spi/log/InterpretedLog";
import { ProgressLog } from "../../../../../../spi/log/ProgressLog";
import { ManagedDeployments, ManagedDeploymentTargetInfo } from "../appManagement";
import { DefaultLocalDeployerOptions, LocalDeployerOptions } from "../LocalDeployerOptions";

/**
 * Managed deployments
 */
let managedDeployments: ManagedDeployments;

/**
 * Use Maven to deploy
 * @param opts options
 */
export function mavenDeployer(opts: LocalDeployerOptions): SourceDeployer {
    if (!managedDeployments) {
        logger.info("Created new deployments record");
        managedDeployments = new ManagedDeployments(opts.lowerPort);
    }
    return new MavenSourceDeployer({
        ...DefaultLocalDeployerOptions,
        ...opts,
    });
}

class MavenSourceDeployer implements SourceDeployer {

    constructor(public opts: LocalDeployerOptions) {
    }

    public async undeploy(ti: ManagedDeploymentTargetInfo): Promise<any> {
        return managedDeployments.terminateIfRunning(ti.managedDeploymentKey);
    }

    public async deployFromSource(id: GitHubRepoRef,
                                  ti: ManagedDeploymentTargetInfo,
                                  log: ProgressLog,
                                  creds: ProjectOperationCredentials,
                                  atomistTeam: string): Promise<Deployment> {

        const port = managedDeployments.findPort(ti.managedDeploymentKey);
        logger.info("Deploying app [%j],branch=%s on port [%d] for team %s", id, ti.managedDeploymentKey.branch, port, atomistTeam);

        await managedDeployments.terminateIfRunning(ti.managedDeploymentKey);

        const cloned = await GitCommandGitProject.cloned(creds, id);
        const branchId = ti.managedDeploymentKey;
        const startupInfo = {
            port,
            atomistTeam,
            contextRoot: `/${branchId.owner}/${branchId.repo}/${branchId.branch}`,
        };
        const childProcess = spawn("mvn",
            [
                "spring-boot:run",
            ].concat(this.opts.commandLineArgumentsFor(startupInfo)),
            {
                cwd: cloned.baseDir,
            });
        if (!childProcess.pid) {
            throw new Error("Fatal error deploying using Maven--is `mvn` on your automation node path?\n" +
                "Attempted to execute `mvn: spring-boot:run`");
        }
        childProcess.stdout.on("data", what => log.write(what.toString()));
        childProcess.stderr.on("data", what => log.write(what.toString()));
        return new Promise((resolve, reject) => {
            childProcess.stdout.addListener("data", what => {
                // TODO too Tomcat specific
                if (!!what && what.toString().includes("Tomcat started on port")) {
                    managedDeployments.recordDeployment({
                        id: branchId,
                        port, childProcess,
                    });
                    resolve({
                        endpoint: `${this.opts.baseUrl}:${port}/${startupInfo.contextRoot}`,
                    });
                }
            });
            childProcess.addListener("exit", () => {
                reject("We should have found Tomcat endpoint by now!!");
            });
            childProcess.addListener("error", reject);
        });
    }

    public logInterpreter(log: string): InterpretedLog | undefined {
        return springBootRunLogInterpreter(log) || shortLogInterpreter(log);
    }

}

const shortLogInterpreter: LogInterpreter = (log: string) => {
    if (log.length < 200) {
        return {
            relevantPart: log,
            message: "This is the whole log.",
            includeFullLog: false,
        };
    }
};

const springBootRunLogInterpreter: LogInterpreter = (log: string) => {
    logger.debug("Interpreting log");

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
};

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
