import { logger } from "@atomist/automation-client";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { ChildProcess, spawn } from "child_process";
import { DeployableArtifact } from "../../../ArtifactStore";
import { QueryableProgressLog } from "../../../log/ProgressLog";
import { Deployer, InterpretedLog } from "../../Deployer";
import { Deployment, TargetInfo } from "../../Deployment";

/**
 * Ports will be reused for the same app
 */
interface DeployedApp {
    id: RemoteRepoRef;
    port: number;

    /** Will be undefined if the app is not currently deployed */
    childProcess: ChildProcess;
}

const deployments: DeployedApp[] = [];

const InitialPort = 8080;

function nextFreePort(): number {
    let port = InitialPort;
    while (deployments.some(d => d.port === port)) {
        port++;
    }
    return port;
}

function findPort(id: RemoteRepoRef): number {
    const running = deployments.find(d => d.id.owner === id.owner && d.id.repo === id.repo);
    return !!running ? running.port : nextFreePort();
}

/**
 * Spawn a new process to use the Cloud Foundry CLI to push.
 * Note that this isn't thread safe concerning multiple logins or spaces.
 */
export function mavenDeployer(baseUrl: string = "http://localhost"): Deployer {
    return new MavenDeployer(baseUrl);
}

class MavenDeployer implements Deployer {

    constructor(public baseUrl: string) {
    }

    public async undeploy(id: RemoteRepoRef): Promise<any> {
        const victim = deployments.find(d => d.id.sha === id.sha);
        if (!!victim) {
            victim.childProcess.kill();
            // Keep the port but deallocate the process
            victim.childProcess = undefined;
            logger.info("Killed app [%j], but continuing to reserve port [%d]", victim.port);
        }
    }

    public async deploy(da: DeployableArtifact, cfi: TargetInfo, log: QueryableProgressLog): Promise<Deployment> {
        if (!da) {
            throw new Error("no DeployableArtifact passed in");
        }
        const baseUrl = this.baseUrl;
        const port = findPort(da.id);
        logger.info("Deploying app [%j] at port [%d]", da, port);
        const childProcess = spawn("mvn",
            [
                "spring-boot:run",
                `-Dserver.port=${port}`,
            ],
            {
                cwd: da.cwd + "/..",
            });
        childProcess.stdout.on("data", what => log.write(what.toString()));
        childProcess.stderr.on("data", what => log.write(what.toString()));
        return new Promise((resolve, reject) => {
            childProcess.stdout.addListener("data", what => {
                // TODO too Tomcat specific
                if (!!what && what.toString().includes("Tomcat started on port")) {
                    deployments.push({id: da.id, port, childProcess});
                    resolve({
                        endpoint: `${baseUrl}:${port}`,
                    });
                }
            });
            childProcess.addListener("exit", () => {
                reject("We should have found Tomcat endpoint by now!!");
            });
            childProcess.addListener("error", reject);
        });
    }

    public errorParser(log: string): InterpretedLog | undefined {
        const relevantPart = log.split("\n")
            .filter(l => l.startsWith("[ERROR]"))
            .join("\n");
        return {
            relevantPart,
            message: "Maven errors",
            includeFullLog: true,
        };
    }

}
