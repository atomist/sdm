import { logger } from "@atomist/automation-client";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { spawn } from "child_process";
import { DeployableArtifact } from "../../../../../../spi/artifact/ArtifactStore";
import { Deployer } from "../../../../../../spi/deploy/Deployer";
import { Deployment, TargetInfo } from "../../../../../../spi/deploy/Deployment";
import { InterpretedLog } from "../../../../../../spi/log/InterpretedLog";
import { ProgressLog } from "../../../../../../spi/log/ProgressLog";
import { ManagedDeployments } from "../appManagement";
import { DefaultLocalDeployerOptions, LocalDeployerOptions, StartupInfo } from "../LocalDeployerOptions";

/**
 * Managed deployments
 */
let managedDeployments: ManagedDeployments;

/**
 * Start up an executable Jar on the same node as the automation client.
 * Not for production use.
 * @param opts options
 */
export function executableJarDeployer(opts: LocalDeployerOptions): Deployer {
    if (!managedDeployments) {
        logger.info("Created new deployments record");
        managedDeployments = new ManagedDeployments(opts.lowerPort);
    }
    return new ExecutableJarDeployer({
        ...DefaultLocalDeployerOptions,
        ...opts,
    });
}

class ExecutableJarDeployer implements Deployer {

    constructor(public opts: LocalDeployerOptions) {
    }

    public async undeploy(id: RemoteRepoRef): Promise<any> {
        return managedDeployments.terminateIfRunning(id);
    }

    public async deploy(da: DeployableArtifact,
                        ti: TargetInfo,
                        log: ProgressLog,
                        creds: ProjectOperationCredentials,
                        atomistTeam: string): Promise<Deployment> {
        const baseUrl = this.opts.baseUrl;
        const port = managedDeployments.findPort(da.id);
        logger.info("Deploying app [%j] on port [%d] for team %s", da, port, atomistTeam);
        const startupInfo: StartupInfo = {
            port,
            atomistTeam,
            contextRoot: `/${da.id.owner}/${da.id.repo}/staging`,
        };
        await managedDeployments.terminateIfRunning(da.id);
        const childProcess = spawn("java",
            [
                "-jar",
                da.filename,
            ].concat(this.opts.commandLineArgumentsFor(startupInfo)),
            {
                cwd: da.cwd,
            });
        childProcess.stdout.on("data", what => log.write(what.toString()));
        childProcess.stderr.on("data", what => log.write(what.toString()));
        return new Promise((resolve, reject) => {
            childProcess.stdout.addListener("data", what => {
                // TODO too Tomcat specific
                if (!!what && what.toString().includes("Tomcat started on port")) {
                    managedDeployments.recordDeployment({id: da.id, port, childProcess});
                    resolve({
                        endpoint: `${baseUrl}:${port}/${startupInfo.contextRoot}`,
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
