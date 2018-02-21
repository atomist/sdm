import { logger } from "@atomist/automation-client";
import { runCommand } from "@atomist/automation-client/action/cli/commandLine";
import { ProjectOperationCredentials, } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { spawn } from "child_process";
import { DeployableArtifact } from "../../ArtifactStore";
import { QueryableProgressLog } from "../../log/ProgressLog";
import { Deployer } from "../Deployer";
import { Deployment } from "../Deployment";
import { parseCloudFoundryLogForEndpoint } from "./cloudFoundryLogParser";
import { CloudFoundryInfo, ManifestPath } from "./CloudFoundryTarget";

/**
 * Spawn a new process to use the Cloud Foundry CLI to push.
 * Note that this isn't thread safe concerning multiple logins or spaces.
 */
export class CommandLineCloudFoundryDeployer implements Deployer<CloudFoundryInfo> {

    public async deploy(da: DeployableArtifact,
                        cfi: CloudFoundryInfo,
                        log: QueryableProgressLog,
                        creds: ProjectOperationCredentials): Promise<Deployment> {
        if (!da) {
            throw new Error("no DeployableArtifact passed in");
        }
        logger.info("Deploying app [%j] to Cloud Foundry [%j]", da, cfi.description);

        // We need the Cloud Foundry manifest. If it's not found, we can't deploy
        const sources = await GitCommandGitProject.cloned(creds, da.id);
        const manifestFile = await sources.findFile(ManifestPath);

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
        childProcess.stdin.end(); // if it asks for something, please don't freeze forever
        childProcess.stdout.on("data", what => log.write(what.toString()));
        childProcess.stderr.on("data", what => log.write(what.toString()));
        return new Promise((resolve, reject) => {
            childProcess.addListener("exit", () => {
                resolve({endpoint: parseCloudFoundryLogForEndpoint(log.log)});
            });
            childProcess.addListener("error", reject);
        });
    }

    public logInterpreter(log: string) {
        return {
            relevantPart: "",
            message: "Deploy failed",
            includeFullLog: true
        }
    }

}

function toUrl(name: string) {
    return `http://${name}.cfapps.io/`;
}
