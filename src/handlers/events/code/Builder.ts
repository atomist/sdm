import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { createStatus } from "../../commands/editors/toclient/ghub";
import { ProgressLog } from "./DeploymentChain";
import EventEmitter = NodeJS.EventEmitter;
import { ChildProcess } from "child_process";

// TODO do for local with child process
export interface RunningBuild {

    readonly stream: EventEmitter;

    readonly rr: RemoteRepoRef;

    // Log to date
    readonly log: string;
}

export interface Builder {

    build(creds: ProjectOperationCredentials, rr: RemoteRepoRef, team: string, log?: ProgressLog): Promise<RunningBuild>;

}

/**
 * Superclass for build, emitting appropriate events to Atomist
 */
export abstract class LocalBuilder {

    public build(creds: ProjectOperationCredentials, rr: RemoteRepoRef, team: string, log?: ProgressLog): Promise<RunningBuild> {
        return this.startBuild(creds, rr, team)
            .then(rb => onStarted(rb))
            .then(rb => {
                if (!!log) {
                    // TODO doesn't work
                    // rb.stream.addListener("message", what => log.write(what.toString()));
                }
                //(rb.stream as ChildProcess).on("data", data => output += data.toString());

                //rb.stream.on("end", resolve);
                rb.stream.addListener("exit", (code, signal) => onExit(code, signal, rb))
                    //.addListener("end", (code, signal) => onExit(code, signal, output))
                    //.addListener("close", (code, signal) => onExit(code, signal, output))
                    .addListener("error", err => console.log("*********** Error: " + err));
                return rb;
            });
    }

    protected abstract startBuild(creds: ProjectOperationCredentials, rr: RemoteRepoRef, team: string): Promise<RunningBuild>;
}

function onStarted(runningBuild: RunningBuild): Promise<RunningBuild> {
    console.log("BUILD STARTED: Sent event to Atomist");
    return Promise.resolve(runningBuild);
}

function onExit(code: number, signal: any, rb: RunningBuild): void {
    console.log(`BUILD exited with ${code} and signal ${signal}`);
    console.log(rb.log);
    // do promise stuff
}

export const ScanBase = "https://scan.atomist.com";

export const ArtifactContext = "artifact";

function setArtifact(id: GitHubRepoRef): Promise<any> {
    // TODO hard coded token must go
    return createStatus(process.env.GITHUB_TOKEN, id, {
        state: "success",
        target_url: `${ScanBase}/${id.owner}/${id.repo}/${id.sha}`,
        context: ArtifactContext,
    });
}
