import { logger } from "@atomist/automation-client";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { exec, ExecOptions } from "child_process";
import { ArtifactStore } from "../../../../../../spi/artifact/ArtifactStore";
import { AppInfo } from "../../../../../../spi/deploy/Deployment";
import { InterpretedLog, LogInterpretation } from "../../../../../../spi/log/InterpretedLog";
import { LogFactory, ProgressLog } from "../../../../../../spi/log/ProgressLog";
import { LocalBuilder, LocalBuildInProgress } from "../LocalBuilder";

/**
 * Build with npm in the local automation client.
 * Note it is NOT intended for use for multiple organizations. It's OK
 * for one organization to use inside its firewall, but there is potential
 * vulnerability in builds of unrelated tenants getting at each others
 * artifacts.
 */
export class NpmBuilder extends LocalBuilder implements LogInterpretation {

    constructor(artifactStore: ArtifactStore, logFactory: LogFactory,
                private buildCommand: string = "npm run build") {
        super(artifactStore, logFactory);
    }

    protected async startBuild(creds: ProjectOperationCredentials,
                               id: RemoteRepoRef,
                               team: string,
                               log: ProgressLog): Promise<LocalBuildInProgress> {
        const p = await GitCommandGitProject.cloned(creds, id);
        // Find the artifact info from package.json
        const pom = await p.findFile("package.json");
        const content = await pom.getContent();
        const json = JSON.parse(content);
        const appId: AppInfo = {id, name: json.name, version: json.version};
        const opts = {
            cwd: p.baseDir,
        };

        try {
            const install = await runCommand("npm install", opts, log);
            const build = await runCommand(this.buildCommand, opts, log);
            const error = log.log.includes("ERROR:");
            const b = new NpmBuild(appId, id, ({error, code: build.code}), team, log.url);
            logger.info("Build complete: %j", b.buildResultAchieved);
            return b;
        } catch {
            const b = new NpmBuild(appId, id, ({error: true, code: 1}), team, log.url);
            logger.info("Build FAILURE: %j", b.buildResultAchieved);
            return b;
        }

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

export interface Result {
    code: number;
    signal: string;
}

function runCommand(command: string, opts: ExecOptions, log: ProgressLog): Promise<Result> {
    logger.debug("Running command [%s] in %j", command, opts);
    const cmd = exec(command, opts);
    cmd.stdout.addListener("data", what => log.write(what.toString()));
    cmd.stderr.addListener("data", what => log.write(what.toString()));
    cmd.stdout.addListener("data", what => console.log(what.toString()));
    cmd.stderr.addListener("data", what => console.log(what.toString()));
    return new Promise<Result>((resolve, reject) => {
        cmd.on("exit", (code, signal) => {
            logger.info("Success: Returning code=%d", code);
            return resolve(({code, signal}));
        });
        cmd.on("error", (code, signal) => {
            logger.warn("ERROR: Returning code=%d", code);
            return reject(({code, signal}));
        });
    });
}

class NpmBuild implements LocalBuildInProgress {

    public readonly buildResult: Promise<{ error: boolean, code: number }>;

    constructor(public appInfo: AppInfo,
                public repoRef: RemoteRepoRef,
                public buildResultAchieved: { error: boolean, code: number },
                public team: string,
                public url: string) {
        this.buildResult = Promise.resolve(buildResultAchieved);
    }

    public deploymentUnitFile: string;

}
