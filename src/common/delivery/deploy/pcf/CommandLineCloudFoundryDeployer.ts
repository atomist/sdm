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
import { runCommand } from "@atomist/automation-client/action/cli/commandLine";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { spawn } from "child_process";
import { DeployableArtifact } from "../../../../spi/artifact/ArtifactStore";
import { ArtifactDeployer } from "../../../../spi/deploy/ArtifactDeployer";
import { Deployment } from "../../../../spi/deploy/Deployment";
import { ProgressLog } from "../../../../spi/log/ProgressLog";
import { parseCloudFoundryLogForEndpoint } from "./cloudFoundryLogParser";
import { CloudFoundryInfo, CloudFoundryManifestPath } from "./CloudFoundryTarget";

/**
 * Spawn a new process to use the Cloud Foundry CLI to push.
 * Note that this isn't thread safe concerning multiple logins or spaces.
 */
export class CommandLineCloudFoundryDeployer implements ArtifactDeployer<CloudFoundryInfo> {

    public async deploy(da: DeployableArtifact,
                        cfi: CloudFoundryInfo,
                        log: ProgressLog,
                        credentials: ProjectOperationCredentials): Promise<Deployment> {
        logger.info("Deploying app [%j] to Cloud Foundry [%j]", da, cfi.description);

        // We need the Cloud Foundry manifest. If it's not found, we can't deploy
        const sources = await GitCommandGitProject.cloned(credentials, da.id);
        const manifestFile = await sources.findFile(CloudFoundryManifestPath);

        if (!cfi.api || !cfi.org || !cfi.username || !cfi.password) {
            throw new Error("cloud foundry authentication information missing. See CloudFoundryTarget.ts");
        }

        // TODO: if the password is wrong, things hangs forever waiting for input.
        await runCommand(
            `cf login -a ${cfi.api} -o ${cfi.org} -u ${cfi.username} -p '${cfi.password}' -s ${cfi.space}`,
            {cwd: da.cwd});
        console.log("Successfully selected space [%s]", cfi.space);
        // Turn off color so we don't have unpleasant escape codes in web stream
        await runCommand("cf config --color false", {cwd: da.cwd});
        const childProcess = spawn("cf",
            [
                "push",
                da.name,
                "-f",
                sources.baseDir + "/" + manifestFile.path,
                "-p",
                da.filename,
                "--random-route",
            ],
            {
                cwd: da.cwd,
            });
        childProcess.stdout.on("data", what => log.write(what.toString()));
        childProcess.stderr.on("data", what => log.write(what.toString()));
        return new Promise((resolve, reject) => {
            childProcess.addListener("exit", (code, signal) => {
                if (code !== 0) {
                    reject(`Error: code ${code}`);
                }
                resolve({endpoint: parseCloudFoundryLogForEndpoint(log.log)});
            });
            childProcess.addListener("error", reject);
        });
    }

    public logInterpreter(log: string) {
        return {
            relevantPart: "",
            message: "Deploy failed",
            includeFullLog: true,
        };
    }

}
