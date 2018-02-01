
import { logger } from "@atomist/automation-client";
import { runCommand } from "@atomist/automation-client/action/cli/commandLine";
import { LocalProject } from "@atomist/automation-client/project/local/LocalProject";
import { spawn } from "child_process";
import { Deployer } from "./Deployer";
import { AppInfo, CloudFoundryInfo, Deployment, ProgressLog } from "./DeploymentChain";
import { identification } from "./pomParser";
import { VersionedArtifact } from "./VersionedArtifact";

export class CloudFoundryDeployer implements Deployer {

    public deploy<P extends LocalProject>(proj: P, cfi: CloudFoundryInfo, log: ProgressLog): Promise<Deployment> {
        log.write("Analyzing application...\n");
        const appId: Promise<AppInfo & VersionedArtifact> =
            proj.findFile("pom.xml")
                .then(pom => pom.getContent()
                    .then(content => identification(content)))
                .then(va => ({...va, name: va.artifact}));

        return appId.then(ai => {
            logger.info("\n\nDeploying app [%j] to Cloud Foundry [%j]", ai, cfi);
            log.write(`Logging into Cloud Foundry as ${cfi.username}...\n`);

            /*addManifest<LocalProject>(ai, log)(proj)*/
            return Promise.resolve(proj)
                .then(p => runCommand(
                    `cf login -a ${cfi.api} -o ${cfi.org} -u ${cfi.username} -p "${cfi.password}" -s ${cfi.space}`,
                    {cwd: p.baseDir})// [-o ORG] [-s SPACE]`)
                    .then(_ => {
                        console.log("Successfully logged into Cloud Foundry as [%s]", cfi.username);
                        // Turn off color so we don't have unpleasant escape codes in web stream
                        return runCommand("cf config --color false", {cwd: p.baseDir});
                    })
                    .then(() => {
                        const childProcess = spawn("cf",
                            [
                                "push",
                                ai.name,
                                "-p",
                                toJar(ai),
                                "--random-route",
                            ],
                            {
                                cwd: p.baseDir,
                            });
                        return {
                            childProcess,
                            url: toUrl(ai.name),
                        };
                    }));
        });
    }

}

function toUrl(name: string) {
    return `http://${name}.cfapps.io/`;
}

function toJar(ai: VersionedArtifact) {
    return `target/${ai.artifact}-${ai.version}.jar`;
}
