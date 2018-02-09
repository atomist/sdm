import { logger } from "@atomist/automation-client";
import { runCommand } from "@atomist/automation-client/action/cli/commandLine";
import { LocalProject } from "@atomist/automation-client/project/local/LocalProject";
import { spawn } from "child_process";
import { CloudFoundryInfo, Deployment, ProgressLog } from "./DeploymentChain";
import { VersionedArtifact } from "./VersionedArtifact";
import { DeployableArtifact } from "./DeployOnBuildSuccessStatus";

export class CloudFoundryDeployer /*implements Deployer */ {

    public deploy<P extends LocalProject>(ai: DeployableArtifact, cfi: CloudFoundryInfo, log: ProgressLog): Promise<Deployment> {
        log.write("Analyzing application...\n");

        logger.info("\n\nDeploying app [%j] to Cloud Foundry [%j]", ai, cfi);
        log.write(`Logging into Cloud Foundry as ${cfi.username}...\n`);

        /*addManifest<LocalProject>(ai, log)(proj)*/
        return runCommand(
            `cf login -a ${cfi.api} -o ${cfi.org} -u ${cfi.username} -p "${cfi.password}" -s ${cfi.space}`,
            {cwd: ai.cwd})// [-o ORG] [-s SPACE]`)
            .then(_ => {
                console.log("Successfully logged into Cloud Foundry as [%s]", cfi.username);
                // Turn off color so we don't have unpleasant escape codes in web stream
                return runCommand("cf config --color false", {cwd: ai.cwd});
            })
            .then(() => {
                const childProcess = spawn("cf",
                    [
                        "push",
                        ai.name,
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
            });
    }

}

function toUrl(name: string) {
    return `http://${name}.cfapps.io/`;
}

function toJar(ai: VersionedArtifact) {
    return `target/${ai.artifact}-${ai.version}.jar`;
}
