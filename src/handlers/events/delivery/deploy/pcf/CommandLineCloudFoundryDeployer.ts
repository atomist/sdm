import { logger } from "@atomist/automation-client";
import { runCommand } from "@atomist/automation-client/action/cli/commandLine";
import { spawn } from "child_process";
import { DeployableArtifact } from "../../ArtifactStore";
import { QueryableProgressLog } from "../../log/ProgressLog";
import { Deployer } from "../Deployer";
import { Deployment } from "../Deployment";
import { parseCloudFoundryLogForEndpoint } from "./cloudFoundryLogParser";
import { CloudFoundryInfo } from "./CloudFoundryTarget";

/**
 * Spawn a new process to use the Cloud Foundry CLI to push.
 * Note that this isn't thread safe concerning multiple logins or spaces.
 */
export class CommandLineCloudFoundryDeployer implements Deployer<CloudFoundryInfo> {

    public async deploy(da: DeployableArtifact, cfi: CloudFoundryInfo, log: QueryableProgressLog): Promise<Deployment> {
        if (!da) {
            throw new Error("no DeployableArtifact passed in");
        }
        logger.info("Deploying app [%j] to Cloud Foundry [%j]", da, cfi.description);
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
                "../manifest.yml", // TODO this isn't elegant as it requires a whole clone
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
            childProcess.addListener("exit", () => {
                resolve({ endpoint: parseCloudFoundryLogForEndpoint(log.log) });
            });
            childProcess.addListener("error", reject);
        });
    }

}

function toUrl(name: string) {
    return `http://${name}.cfapps.io/`;
}
