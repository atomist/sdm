import { logger } from "@atomist/automation-client";
import { spawn } from "child_process";
import { Deployer } from "../../Deployer";
import { Deployment, TargetInfo } from "../../Deployment";
import { QueryableProgressLog } from "../../../log/ProgressLog";
import { DeployableArtifact } from "../../../ArtifactStore";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";

interface DeployedApp {
    id: RemoteRepoRef;
    port: number;
}

const deployments: DeployedApp[] = [];

/**
 * Spawn a new process to use the Cloud Foundry CLI to push.
 * Note that this isn't thread safe concerning multiple logins or spaces.
 */
export const MavenDeployer: Deployer = {

    async undeploy(id: RemoteRepoRef): Promise<any> {
        throw new Error("Undeploy not yet impelmented");
    },

    async deploy(ai: DeployableArtifact, cfi: TargetInfo, log: QueryableProgressLog): Promise<Deployment> {
        if (!ai) {
            throw new Error("no DeployableArtifact passed in");
        }
        logger.info("\n\nDeploying app [%j] to Cloud Foundry [%j]", ai, cfi.description);
        const childProcess = spawn("mvn",
            [
                "spring-boot:run",
                // TODO pass in port with -D
            ],
            {
                cwd: ai.cwd + "/..",
            });
        childProcess.stdout.on("data", what => log.write(what.toString()));
        childProcess.stderr.on("data", what => log.write(what.toString()));
        return new Promise((resolve, reject) => {
            childProcess.stdout.addListener("data", what => {
                // TODO too Tomcat specific
                const port = 8080;
                if (!!what && what.toString().includes("Tomcat started on port")) {
                    deployments.push({id: ai.id, port});
                    resolve({
                        endpoint: `http://localhost:${port}`,
                    });
                }
            });
            childProcess.addListener("exit", () => {
                reject("We should have found Tomcat endpoint by now!!");
            });
            childProcess.addListener("error", reject);
        });
    },

};

