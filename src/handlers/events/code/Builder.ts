import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import {
    ProjectOperationCredentials,
    TokenCredentials,
} from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { createStatus } from "../../commands/editors/toclient/ghub";
import { AppInfo } from "./Deployment";

import axios from "axios";
import EventEmitter = NodeJS.EventEmitter;
import { Readable, Stream } from "stream";
import { ArtifactStore, StoredArtifact } from "./ArtifactStore";
import { ProgressLog } from "./ProgressLog";

// TODO do for local with child process, or output stream
export interface RunningBuild {

    readonly stream: EventEmitter;

    readonly repoRef: RemoteRepoRef;

    readonly team: string;

    /** Log output so far */
    readonly log: string;

    /** Available once build is complete */
    readonly appInfo: AppInfo;

    readonly deploymentUnitStream: Readable;

    readonly deploymentUnitFile: string;
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
                rb.stream.addListener("exit", (code, signal) => onExit(code, signal, rb, creds))
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
    return updateAtomistLifecycle(runningBuild, "STARTED", "STARTED");
}

function onSuccess(runningBuild: RunningBuild) {
    return updateAtomistLifecycle(runningBuild, "SUCCESS", "FINALIZED");
    // .then(rb => {
    //     console.log("Running build AI = " + JSON.stringify(rb.appInfo));
    //     return rb;
    // });
}

function onFailure(runningBuild: RunningBuild) {
    return updateAtomistLifecycle(runningBuild, "FAILURE", "FINALIZED");
}

function updateAtomistLifecycle(runningBuild: RunningBuild,
                                status: "STARTED" | "SUCCESS" | "FAILURE",
                                phase: "STARTED" | "FINALIZED" = "FINALIZED"): Promise<RunningBuild> {
    const url = `https://webhook.atomist.com/atomist/jenkins/teams/${runningBuild.team}`;
    const data = {
        name: `Build ${runningBuild.repoRef.sha}`,
        duration: 3,
        build: {
            number: "Build",
            scm: {
                commit: runningBuild.repoRef.sha,
                url: `https://github.com/${runningBuild.repoRef.owner}/${runningBuild.repoRef.repo}`,
                // TODO is this required
                branch: "master",
            },
            phase,
            status,
            full_url: `https://github.com/${runningBuild.repoRef.owner}/${runningBuild.repoRef.repo}/commit/${runningBuild.repoRef.sha}`,
        },
    };
    console.log(`BUILD UPDATE: Sending event to Atomist at ${url}\n${JSON.stringify(data)}`);
    return axios.post(url, data)
        .then(() => runningBuild);
}

function onExit(code: number, signal: any, rb: RunningBuild, creds: ProjectOperationCredentials): void {
    console.log(`BUILD exited with ${code} and signal ${signal}`);
    //console.log(rb.log);
    if (code === 0) {
        onSuccess(rb)
            .then(id => setArtifact(rb, creds));
    } else {
        onFailure(rb);
    }
}

export const ScanBase = "https://scan.atomist.com";

export const ArtifactContext = "artifact";

class SimpleArtifactStore implements ArtifactStore {

    public store(appInfo: AppInfo, what: Stream): Promise<string> {
        console.log("Storing " + JSON.stringify(appInfo));
        return Promise.resolve("http://www.test.com");
    }

    public storeFile(appInfo: AppInfo, what: string): Promise<string> {
        console.log("Storing " + JSON.stringify(appInfo));
        return Promise.resolve(what);
    }

    public retrieve(url: string): Promise<StoredArtifact> {
        return null;
    }
}

const artifactStore: ArtifactStore = new SimpleArtifactStore();

function setArtifact(rb: RunningBuild, creds: ProjectOperationCredentials): Promise<any> {
    // TODO hard coded token must go
    const id = rb.repoRef as GitHubRepoRef;
    return artifactStore.storeFile(rb.appInfo, "http://" + rb.deploymentUnitFile)
        .then(target_url => createStatus((creds as TokenCredentials).token, id, {
            state: "success",
            target_url,
            context: ArtifactContext,
            //description:
        }));
}
