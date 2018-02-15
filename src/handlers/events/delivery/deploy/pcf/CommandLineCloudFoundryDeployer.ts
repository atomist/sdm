import {logger} from "@atomist/automation-client";
import {runCommand} from "@atomist/automation-client/action/cli/commandLine";
import {spawn} from "child_process";
import {DeployableArtifact} from "../../ArtifactStore";
import {Deployer} from "../../Deployer";
import {Deployment} from "../../Deployment";
import {ProgressLog} from "../../log/ProgressLog";
import {CloudFoundryInfo} from "./CloudFoundryTarget";

/**
 * Spawn a new process to use the Cloud Foundry CLI to push
 */
export class CommandLineCloudFoundryDeployer implements Deployer<CloudFoundryInfo> {

    public async deploy(ai: DeployableArtifact, cfi: CloudFoundryInfo, log: ProgressLog): Promise<Deployment> {
        if (!ai) {
            throw new Error("no DeployableArtifact passed in");
        }
        logger.info("\n\nDeploying app [%j] to Cloud Foundry [%j]", ai, cfi.description);
        await runCommand(
            `cf login -a ${cfi.api} -o ${cfi.org} -u ${cfi.username} -p '${cfi.password}' -s ${cfi.space}`,
            {cwd: ai.cwd});
        console.log("Successfully selected space [%s]", cfi.space);
        // Turn off color so we don't have unpleasant escape codes in web stream
        await runCommand("cf config --color false", {cwd: ai.cwd});
        const childProcess = spawn("cf",
            [
                "push",
                ai.name,
                "-f",
                "../manifest.yml", // TODO this isn't elegant as it requires a whole clone
                "-p",
                ai.filename,
                "--random-route",
            ],
            {
                cwd: ai.cwd,
            });
        return {
            childProcess,
            url: toUrl(ai.name),
        };
    }

}

function toUrl(name: string) {
    return `http://${name}.cfapps.io/`;
}
