import { logger } from "@atomist/automation-client";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { ChildProcess, spawn } from "child_process";
import { DeployableArtifact } from "../../../ArtifactStore";
import { InterpretedLog } from "../../../log/InterpretedLog";
import { QueryableProgressLog } from "../../../log/ProgressLog";
import { Deployer } from "../../Deployer";
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
 * Start up an executable Jar
 */
export function executableJarDeployer(baseUrl: string = "http://localhost"): Deployer {
    return new ExecutableJarDeployer(baseUrl);
}

class ExecutableJarDeployer implements Deployer {

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

    public async deploy(da: DeployableArtifact, ti: TargetInfo,
                        log: QueryableProgressLog, team: string): Promise<Deployment> {
        const baseUrl = this.baseUrl;
        const port = findPort(da.id);
        logger.info("Deploying app [%j] at port [%d]", da, port);
        const childProcess = spawn("java",
            [
                "-jar",
                da.filename,
                `-Dserver.port=${port}`,
                `-DATOMIST_TEAM=${team}`,
            ],
            {
                cwd: da.cwd,
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

    public logInterpreter(log: string): InterpretedLog | undefined {
        if (!log) {
            logger.warn("log was empty");
            return undefined;
        }

        const maybeFailedToStart = appFailedToStart(log);
        if (maybeFailedToStart) {
            return {
                relevantPart: maybeFailedToStart,
                message: "Application failed to start",
                includeFullLog: false,
            };
        }

        // default to maven errors
        const maybeMavenErrors = mavenErrors(log);
        if (maybeMavenErrors) {
            logger.info("recognized maven error");
            return {
                relevantPart: maybeMavenErrors,
                message: "Maven errors",
                includeFullLog: true,
            };
        }

        // or it could be this problem here
        if (log.match(/Error checking out artifact/)) {
            logger.info("Recognized artifact error");
            return {
                relevantPart: log,
                message: "I lost the local cache. Please rebuild",
                includeFullLog: false,
            };
        }

        logger.info("Did not find anything to recognize in the log");
    }

}

function appFailedToStart(log: string) {
    const lines = log.split("\n");
    const failedToStartLine = lines.indexOf("APPLICATION FAILED TO START");
    if (failedToStartLine < 1) {
        return undefined;
    }
    const likelyLines = lines.slice(failedToStartLine + 3, failedToStartLine + 10);
    return likelyLines.join("\n");
}

function mavenErrors(log: string) {
    if (log.match(/^\[ERROR]/m)) {
        return log.split("\n")
            .filter(l => l.startsWith("[ERROR]"))
            .join("\n");
    }
}
