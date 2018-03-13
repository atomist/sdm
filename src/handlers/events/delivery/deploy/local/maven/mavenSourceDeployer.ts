import { logger } from "@atomist/automation-client";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { spawn } from "child_process";
import { Deployment } from "../../../../../../spi/deploy/Deployment";
import { InterpretedLog, LogInterpreter } from "../../../../../../spi/log/InterpretedLog";
import { ProgressLog } from "../../../../../../spi/log/ProgressLog";
import { ManagedDeployments, ManagedDeploymentTargetInfo } from "../appManagement";
import { DefaultLocalDeployerOptions, LocalDeployerOptions, } from "../LocalDeployerOptions";
import { ArtifactStore, DeployableArtifact } from "../../../../../../spi/artifact/ArtifactStore";
import { AppInfo, Deployer } from "../../../../../../";

/**
 * Managed deployments
 */
let managedDeployments: ManagedDeployments;

/**
 * Use Maven to deploy
 * @param opts options
 */
export function mavenDeployer(opts: LocalDeployerOptions): Deployer {
    if (!managedDeployments) {
        logger.info("Created new deployments record");
        managedDeployments = new ManagedDeployments(opts.lowerPort);
    }
    return new MavenSourceDeployer({
        ...DefaultLocalDeployerOptions,
        ...opts,
    });
}

export class CloningArtifactStore implements ArtifactStore {

    public readonly imageUrlIsOptional = true;

    public storeFile(appInfo: AppInfo, localFile: string, creds: ProjectOperationCredentials): Promise<string> {
        throw new Error("Not implemented")
    }

    public async checkout(url: string, id: RemoteRepoRef, creds: ProjectOperationCredentials): Promise<DeployableArtifact> {
        const cloned = await GitCommandGitProject.cloned(creds, id);
        return {
            cwd: cloned.baseDir, filename: ".",
            name: `${id.owner}/${id.repo}`,
            version: id.sha,
            id: id
        };
    }
}


class MavenSourceDeployer implements Deployer<ManagedDeploymentTargetInfo> {


    constructor(public opts: LocalDeployerOptions) {
    }

    public async undeploy(ti: ManagedDeploymentTargetInfo): Promise<any> {
        return managedDeployments.terminateIfRunning(ti.managedDeploymentKey);
    }

    public async deploy(da: DeployableArtifact,
                        ti: ManagedDeploymentTargetInfo,
                        log: ProgressLog,
                        creds: ProjectOperationCredentials,
                        atomistTeam: string): Promise<Deployment> {

        const port = managedDeployments.findPort(ti.managedDeploymentKey);
        logger.info("Deploying app [%j],branch=%s on port [%d] for team %s", da.id, ti.managedDeploymentKey.branch, port, atomistTeam);

        await managedDeployments.terminateIfRunning(ti.managedDeploymentKey);

        const branchId = ti.managedDeploymentKey;
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
                cwd: da.cwd,
            });
        if (!childProcess.pid) {
            throw new Error("Fatal error deploying using Maven--is `mvn` on your automation node path?\n" +
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
                        endpoint: `${this.opts.baseUrl}:${port}/${startupInfo.contextRoot}`,
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
        return springBootRunLogInterpreter(log) || shortLogInterpreter(log);
    }

}

const shortLogInterpreter: LogInterpreter = (log: string) => {
    if (log.length < 200) {
        return {
            relevantPart: log,
            message: "This is the whole log.",
            includeFullLog: false
        }
    }
};

const springBootRunLogInterpreter: LogInterpreter = (log: string) => {
    logger.debug("Interpreting log");

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
