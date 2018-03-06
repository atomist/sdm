import { logger } from "@atomist/automation-client";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { spawn } from "child_process";
import { Deployment } from "../../../../../../spi/deploy/Deployment";
import { SourceDeployer } from "../../../../../../spi/deploy/SourceDeployer";
import { InterpretedLog } from "../../../../../../spi/log/InterpretedLog";
import { ProgressLog } from "../../../../../../spi/log/ProgressLog";
import { ManagedDeployments } from "../appManagement";
import { DefaultLocalDeployerOptions, LocalDeployerOptions } from "../LocalDeployerOptions";
import { AddressChannels } from "../../../../../../common/slack/addressChannels";

/**
 * Managed deployments
 */
let managedDeployments: ManagedDeployments;

/**
 * Use Maven to deploy
 * @param opts options
 */
export function mavenDeployer(opts: LocalDeployerOptions): SourceDeployer {
    if (!managedDeployments) {
        logger.info("Created new deployments record");
        managedDeployments = new ManagedDeployments(opts.lowerPort);
    }
    return new MavenSourceDeployer({
        ...DefaultLocalDeployerOptions,
        ...opts,
    });
}

class MavenSourceDeployer implements SourceDeployer {

    constructor(public opts: LocalDeployerOptions) {
    }

    public async undeploy(id: RemoteRepoRef, branch: string): Promise<any> {
        return managedDeployments.terminateIfRunning({...id, branch});
    }

    public async deployFromSource(id: RemoteRepoRef,
                                  addressChannels: AddressChannels,
                                  log: ProgressLog,
                                  creds: ProjectOperationCredentials,
                                  atomistTeam: string,
                                  branch: string): Promise<Deployment> {
        const baseUrl = this.opts.baseUrl;
        const branchId = {...id, branch};
        const port = managedDeployments.findPort(branchId);
        logger.info("Deploying app [%j],branch=%s on port [%d] for team %s", id, branch, port, atomistTeam);
        const cloned = await GitCommandGitProject.cloned(creds, id);
        await managedDeployments.terminateIfRunning(branchId);
        const startupInfo = {
            port,
            atomistTeam,
            contextRoot: `/${branchId.owner}/${branchId.repo}/${branchId.branch}`,
        };
        const childProcess = spawn("mvn",
            [
                "spring-boot:run",
            ].concat(this.opts.commandLineArgumentsFor(startupInfo)),
            {
                cwd: cloned.baseDir,
            });
        if (!childProcess.pid) {
            await addressChannels("Fatal error deploying using Maven--is `mvn` on your automation node path?\n" +
                "Attempted to execute `mvn: spring-boot:run`");
        }
        childProcess.stdout.on("data", what => log.write(what.toString()));
        childProcess.stderr.on("data", what => log.write(what.toString()));
        return new Promise((resolve, reject) => {
            childProcess.stdout.addListener("data", what => {
                // TODO too Tomcat specific
                if (!!what && what.toString().includes("Tomcat started on port")) {
                    managedDeployments.recordDeployment({
                        id: branchId,
                        port, childProcess,
                    });
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
