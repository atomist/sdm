import { logger } from "@atomist/automation-client";
import { runCommand } from "@atomist/automation-client/action/cli/commandLine";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { spawn } from "child_process";
import { DeployableArtifact } from "../../../../../spi/artifact/ArtifactStore";
import { Deployer } from "../../../../../spi/deploy/Deployer";
import { Deployment } from "../../../../../spi/deploy/Deployment";
import { ProgressLog } from "../../../../../spi/log/ProgressLog";
import { parseCloudFoundryLogForEndpoint } from "./cloudFoundryLogParser";
import { CloudFoundryInfo, CloudFoundryManifestPath } from "./CloudFoundryTarget";

/**
 * Spawn a new process to use the Cloud Foundry CLI to push.
 * Note that this isn't thread safe concerning multiple logins or spaces.
 */
export class CommandLineCloudFoundryDeployer implements Deployer<CloudFoundryInfo> {

    public async deploy(da: DeployableArtifact,
                        cfi: CloudFoundryInfo,
                        log: ProgressLog,
                        creds: ProjectOperationCredentials): Promise<Deployment> {
        logger.info("Deploying app [%j] to Cloud Foundry [%j]", da, cfi.description);

        // We need the Cloud Foundry manifest. If it's not found, we can't deploy
        const sources = await GitCommandGitProject.cloned(creds, da.id);
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

function toUrl(name: string) {
    return `http://${name}.cfapps.io/`;
}
