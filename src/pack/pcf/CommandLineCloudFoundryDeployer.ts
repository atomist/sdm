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

import { logger } from "@atomist/automation-client";
import { runCommand } from "@atomist/automation-client/action/cli/commandLine";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { spawn } from "child_process";
import { DelimitedWriteProgressLogDecorator } from "../../api-helper/log/DelimitedWriteProgressLogDecorator";
import { asSpawnCommand, spawnAndWatch, SpawnCommand, stringifySpawnCommand } from "../../api-helper/misc/spawned";
import { ExecuteGoalResult } from "../../api/goal/ExecuteGoalResult";
import { DeployableArtifact } from "../../spi/artifact/ArtifactStore";
import { Deployer } from "../../spi/deploy/Deployer";
import { ProgressLog } from "../../spi/log/ProgressLog";
import { ProjectLoader } from "../../spi/project/ProjectLoader";
import { parseCloudFoundryLogForEndpoint } from "./cloudFoundryLogParser";
import { CloudFoundryDeployment, CloudFoundryInfo, CloudFoundryManifestPath } from "./CloudFoundryTarget";

/**
 * Spawn a new process to use the Cloud Foundry CLI to push.
 * Note that this isn't thread safe concerning multiple logins or spaces.
 */
export class CommandLineCloudFoundryDeployer implements Deployer<CloudFoundryInfo, CloudFoundryDeployment> {

    constructor(private readonly projectLoader: ProjectLoader) {
    }

    public async deploy(da: DeployableArtifact,
                        cfi: CloudFoundryInfo,
                        log: ProgressLog,
                        credentials: ProjectOperationCredentials): Promise<CloudFoundryDeployment[]> {
        logger.info("Deploying app [%j] to Cloud Foundry [%s]", da, cfi.description);

        // We need the Cloud Foundry manifest. If it's not found, we can't deploy
        // We want a fresh version unless we need it build
        return this.projectLoader.doWithProject({credentials, id: da.id, readOnly: !da.cwd}, async project => {
            const manifestFile = await project.findFile(CloudFoundryManifestPath);

            if (!cfi.api || !cfi.org || !cfi.username || !cfi.password) {
                throw new Error("Cloud foundry authentication information missing. See CloudFoundryTarget.ts");
            }

            const opts = {cwd: !!da.cwd ? da.cwd : project.baseDir};

            // Note: if the password is wrong, things hangs forever waiting for input.
            await runCommand(
                `cf login -a ${cfi.api} -o ${cfi.org} -u ${cfi.username} -p '${cfi.password}' -s ${cfi.space}`,
                opts);
            logger.debug("Successfully selected space [%s]", cfi.space);
            // Turn off color so we don't have unpleasant escape codes in stream
            await runCommand("cf config --color false", {cwd: da.cwd});
            const spawnCommand: SpawnCommand = {
                command: "cf",
                args: [
                    "push",
                    da.name,
                    "-f",
                    project.baseDir + "/" + manifestFile.path,
                    "--random-route"]
                    .concat(
                        !!da.filename ?
                            ["-p",
                                da.filename] :
                            []),
            };

            logger.info("About to issue Cloud Foundry command %s: options=%j", stringifySpawnCommand(spawnCommand), opts);
            const childProcess = spawn(spawnCommand.command, spawnCommand.args, opts);
            const newLineDelimitedLog = new DelimitedWriteProgressLogDecorator(log, "\n");
            childProcess.stdout.on("data", what => newLineDelimitedLog.write(what.toString()));
            childProcess.stderr.on("data", what => newLineDelimitedLog.write(what.toString()));
            return [await new Promise<CloudFoundryDeployment>((resolve, reject) => {
                childProcess.addListener("exit", (code, signal) => {
                    if (code !== 0) {
                        reject(`Error: code ${code}`);
                    }
                    resolve({
                        endpoint: parseCloudFoundryLogForEndpoint(log.log),
                        appName: da.name,
                    });
                });
                childProcess.addListener("error", reject);
            })];
        });
    }

    public async findDeployments(id: RemoteRepoRef,
                                 ti: CloudFoundryInfo,
                                 credentials: ProjectOperationCredentials): Promise<CloudFoundryDeployment[]> {
        logger.warn("Find Deployments is not implemented in CommandLineCloudFoundryDeployer." +
            " You should probably use the CloudFoundryBlueGreenDeployer anyway.");
        return [];
    }

    public async undeploy(cfi: CloudFoundryInfo, deployment: CloudFoundryDeployment, log: ProgressLog): Promise<ExecuteGoalResult> {
        await spawnAndWatch(asSpawnCommand(
            `cf login -a ${cfi.api} -o ${cfi.org} -u ${cfi.username} -p '${cfi.password}' -s ${cfi.space}`),
            {}, log);

        return spawnAndWatch(asSpawnCommand(`cf delete ${deployment.appName}`), {}, log);
    }

    public logInterpreter(log: string) {
        return {
            relevantPart: "",
            message: "Deploy failed",
        };
    }

}
