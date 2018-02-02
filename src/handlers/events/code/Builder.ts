import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { createStatus } from "../../commands/editors/toclient/ghub";
import { ProgressLog } from "./DeploymentChain";
import EventEmitter = NodeJS.EventEmitter;

import axios, { AxiosPromise, AxiosRequestConfig } from "axios";

// TODO do for local with child process
export interface RunningBuild {

    readonly stream: EventEmitter;

    readonly rr: RemoteRepoRef;

    readonly team: string;

    // Log to date
    readonly log: string;
}

export interface Builder {

    build(creds: ProjectOperationCredentials, rr: RemoteRepoRef, team: string, log?: ProgressLog): Promise<RunningBuild>;

}

/**
 * Superclass for build, emitting appropriate events to Atomist
 */
export abstract class LocalBuilder implements Builder {

    public build(creds: ProjectOperationCredentials, rr: RemoteRepoRef, team: string, log?: ProgressLog): Promise<RunningBuild> {
        return this.startBuild(creds, rr, team)
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
                    .addListener("error", (code, signal) => onFailure(rb));
                return rb;
            })
            .then(onStarted);
    }

    protected abstract startBuild(creds: ProjectOperationCredentials, rr: RemoteRepoRef, team: string): Promise<RunningBuild>;
}

function onStarted(runningBuild: RunningBuild) {
    return tellAtomist(runningBuild, "STARTED", "STARTED");
}

function onSuccess(runningBuild: RunningBuild) {
    return tellAtomist(runningBuild, "SUCCESS", "FINALIZED");
}

function onFailure(runningBuild: RunningBuild) {
    return tellAtomist(runningBuild, "FAILURE", "FINALIZED");
}

function tellAtomist(runningBuild: RunningBuild,
                     status: "STARTED" | "SUCCESS" | "FAILURE",
                     phase: "STARTED" | "FINALIZED" = "FINALIZED"): Promise<RunningBuild> {
    const url = `https://webhook.atomist.com/atomist/jenkins/teams/${runningBuild.team}`;
    const data = {
        name: `Build ${runningBuild.rr.sha}`,
        duration: 3,
        build: {
            number: "Build",
            scm: {
                commit: runningBuild.rr.sha,
                url: `https://github.com/${runningBuild.rr.owner}/${runningBuild.rr.repo}`,
                // TODO is this required
                branch: "master",
            },
            phase,
            status,
            full_url: `https://github.com/${runningBuild.rr.owner}/${runningBuild.rr.repo}/commit/${runningBuild.rr.sha}`,
        },
    };
    console.log(`BUILD UPDATE: Sending event to Atomist at ${url}\n${JSON.stringify(data)}`);
    return axios.post(url, data)
        .then(() => runningBuild);
}

function onExit(code: number, signal: any, rb: RunningBuild): void {
    console.log(`BUILD exited with ${code} and signal ${signal}`);
    console.log(rb.log);
    if (code === 0) {
        onSuccess(rb);
    }  else {
        onFailure(rb);
    }
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
