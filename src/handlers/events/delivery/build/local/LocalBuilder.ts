import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import {
    ProjectOperationCredentials,
    TokenCredentials,
} from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { createStatus } from "../../../../commands/editors/toclient/ghub";

import axios from "axios";
import { ArtifactStore } from "../../ArtifactStore";
import { Builder, RunningBuild } from "../../Builder";
import { ProgressLog } from "../../ProgressLog";

/**
 * Superclass for build, emitting appropriate events to Atomist
 */
export abstract class LocalBuilder implements Builder {

    constructor(private artifactStore: ArtifactStore) {}

    public build(creds: ProjectOperationCredentials, rr: RemoteRepoRef, team: string, log?: ProgressLog): Promise<RunningBuild> {
        const as = this.artifactStore;
        return this.startBuild(creds, rr, team)
            .then(rb => {
                if (!!log) {
                    // TODO doesn't work
                    // rb.stream.addListener("message", what => log.write(what.toString()));
                }
                //(rb.stream as ChildProcess).on("data", data => output += data.toString());

                //rb.stream.on("end", resolve);
                rb.stream.addListener("exit", (code, signal) => onExit(code, signal, rb, creds, as))
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

function onExit(code: number, signal: any, rb: RunningBuild, creds: ProjectOperationCredentials, artifactStore: ArtifactStore): void {
    console.log(`BUILD exited with ${code} and signal ${signal}`);
    //console.log(rb.log);
    if (code === 0) {
        onSuccess(rb)
            .then(id => setArtifact(rb, creds, artifactStore));
    } else {
        onFailure(rb);
    }
}

export const ScanBase = "https://scan.atomist.com";

export const ArtifactContext = "artifact";

function setArtifact(rb: RunningBuild, creds: ProjectOperationCredentials, artifactStore: ArtifactStore): Promise<any> {
    // TODO hard coded token must go
    const id = rb.repoRef as GitHubRepoRef;
    return artifactStore.storeFile(rb.appInfo, rb.deploymentUnitFile)
        .then(target_url => createStatus((creds as TokenCredentials).token, id, {
            state: "success",
            target_url,
            context: ArtifactContext,
            //description:
        }));
}
