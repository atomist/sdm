import { runCommand } from "@atomist/automation-client/action/cli/commandLine";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { spawn } from "child_process";
import { ArtifactStore } from "../../../ArtifactStore";
import { AppInfo } from "../../../deploy/Deployment";
import { InterpretedLog, LogInterpretation } from "../../../log/InterpretedLog";
import { LinkableLogFactory, LinkablePersistentProgressLog } from "../../../log/ProgressLog";
import { LocalBuilder, LocalBuildInProgress } from "../LocalBuilder";

/**
 * Build with npm in the local automation client.
 * Note it is NOT intended for use for multiple organizations. It's OK
 * for one organization to use inside its firewall, but there is potential
 * vulnerability in builds of unrelated tenants getting at each others
 * artifacts.
 */
export class NpmBuilder extends LocalBuilder implements LogInterpretation {

    constructor(artifactStore: ArtifactStore, logFactory: LinkableLogFactory) {
        super(artifactStore, logFactory);
    }

    protected async startBuild(creds: ProjectOperationCredentials,
                               id: RemoteRepoRef,
                               team: string,
                               log: LinkablePersistentProgressLog): Promise<LocalBuildInProgress> {
        const p = await GitCommandGitProject.cloned(creds, id);
        // Find the artifact info from package.json
        const pom = await p.findFile("package.json");
        const content = await pom.getContent();
        const json = JSON.parse(content);
        const appId: AppInfo = { id, name: json.name, version: json.version};
        const childProcess = spawn("npm", [
            "i",
            "&",
            "npm",
            "run",
            "build",
        ], {
            cwd: p.baseDir,
        });
        const buildResult = new Promise<{ error: boolean, code: number }>((resolve, reject) => {
            childProcess.stdout.on("data", data => {
                log.write(data.toString());
            });
            childProcess.addListener("exit", (code, signal) => {
                resolve({error: false, code});
            });
            childProcess.addListener("error", (code, signal) => {
                resolve({error: true, code});
            });
        });
        const rb = new UpdatingBuild(id, buildResult, team, log.url);
        rb.ai = appId;
        return rb;
    }

    public logInterpreter(log: string): InterpretedLog | undefined {
        const relevantPart = log.split("\n")
            .filter(l => l.startsWith("ERROR") || l.includes("ERR!"))
            .join("\n");
        return {
            relevantPart,
            message: "npm errors",
            includeFullLog: true,
        };
    }

}

class UpdatingBuild implements LocalBuildInProgress {

    constructor(public repoRef: RemoteRepoRef,
                public buildResult: Promise<{error: boolean, code: number}>,
                public team: string,
                public url: string) {
    }

    public ai: AppInfo;

    public deploymentUnitFile: string;

    get appInfo(): AppInfo {
        return this.ai;
    }

}
