import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { spawn } from "child_process";
import { ArtifactStore } from "../../../../../../spi/artifact/ArtifactStore";
import { AppInfo } from "../../../../../../spi/deploy/Deployment";
import { InterpretedLog, LogInterpretation } from "../../../../../../spi/log/InterpretedLog";
import { LogFactory, ProgressLog } from "../../../../../../spi/log/ProgressLog";
import { LocalBuilder, LocalBuildInProgress } from "../LocalBuilder";
import { identification } from "./pomParser";
import { AddressChannels } from "../../../../../../common/slack/addressChannels";

/**
 * Build with Maven in the local automation client.
 * This implementation requires Java and maven on the classpath.
 * Note it is NOT intended for use for multiple organizations. It's OK
 * for one organization to use inside its firewall, but there is potential
 * vulnerability in builds of unrelated tenants getting at each others
 * artifacts.
 */
export class MavenBuilder extends LocalBuilder implements LogInterpretation {

    constructor(artifactStore: ArtifactStore, logFactory: LogFactory) {
        super(artifactStore, logFactory);
    }

    protected async startBuild(creds: ProjectOperationCredentials,
                               id: RemoteRepoRef,
                               team: string,
                               log: ProgressLog,
                               addressChannels: AddressChannels): Promise<LocalBuildInProgress> {
        const p = await GitCommandGitProject.cloned(creds, id);
        // Find the artifact info from Maven
        const pom = await p.findFile("pom.xml");
        const content = await pom.getContent();
        const va = await identification(content);
        const appId = {...va, name: va.artifact, id};
        const childProcess = spawn("mvn", [
            "package",
            "-DskipTests",
        ], {
            cwd: p.baseDir,
        });
        if (!childProcess.pid) {
            await addressChannels("Fatal error building using Maven--is `mvn` on your automation node path?\n" +
                "Attempted to execute `mvn package`");
        }
        const buildResult = new Promise<{ error: boolean, code: number }>((resolve, reject) => {
            childProcess.stdout.on("data", data => {
                log.write(data.toString());
            });
            childProcess.addListener("exit", (code, signal) => {
                resolve({error: log.log.includes("[ERROR]"), code});
            });
            childProcess.addListener("error", (code, signal) => {
                resolve({error: true, code});
            });
        });
        const rb = new UpdatingBuild(id, buildResult, team, log.url);
        rb.ai = appId;
        rb.deploymentUnitFile = `${p.baseDir}/target/${appId.name}-${appId.version}.jar`;
        return rb;
    }

    public logInterpreter(log: string): InterpretedLog | undefined {
        return interpretMavenLog(log);
    }

}

export function interpretMavenLog(log: string): InterpretedLog | undefined {
    const relevantPart = log.split("\n")
        .filter(l => l.startsWith("[ERROR]"))
        .join("\n");
    return {
        relevantPart,
        message: "Maven errors",
        includeFullLog: true,
    };
}

class UpdatingBuild implements LocalBuildInProgress {

    constructor(public repoRef: RemoteRepoRef,
                public buildResult: Promise<{ error: boolean, code: number }>,
                public team: string,
                public url: string) {
    }

    public ai: AppInfo;

    public deploymentUnitFile: string;

    get appInfo(): AppInfo {
        return this.ai;
    }

}
