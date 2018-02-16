import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";

import { logger } from "@atomist/automation-client";
import axios from "axios";
import { postLinkImageWebhook } from "../../../link/ImageLink";
import { ArtifactStore } from "../../ArtifactStore";
import { Builder, RunningBuild } from "../../Builder";
import { ProgressLog } from "../../log/ProgressLog";

/**
 * Superclass for build implemented on the automation client itself, emitting appropriate events to Atomist
 */
export abstract class LocalBuilder implements Builder {

    constructor(private artifactStore: ArtifactStore) {
    }

    public build(creds: ProjectOperationCredentials, rr: RemoteRepoRef, team: string, log: ProgressLog): Promise<RunningBuild> {
        const as = this.artifactStore;
        return this.startBuild(creds, rr, team, log)
            .then(rb => {
                rb.stream.addListener("exit", (code, signal) => onExit(code, signal, rb, team, as, log))
                    .addListener("error", (code, signal) => onFailure(rb, log));
                return rb;
            })
            .then(onStarted);
    }

    protected abstract startBuild(creds: ProjectOperationCredentials, rr: RemoteRepoRef,
                                  team: string, log: ProgressLog): Promise<RunningBuild>;
}

function onStarted(runningBuild: RunningBuild) {
    return updateAtomistLifecycle(runningBuild, "STARTED", "STARTED");
}

async function onSuccess(runningBuild: RunningBuild, log: ProgressLog) {
    return updateAtomistLifecycle(runningBuild, "SUCCESS", "FINALIZED");
}

async function onFailure(runningBuild: RunningBuild, log: ProgressLog) {
    return updateAtomistLifecycle(runningBuild, "FAILURE", "FINALIZED");
}

function updateAtomistLifecycle(runningBuild: RunningBuild,
                                status: "STARTED" | "SUCCESS" | "FAILURE",
                                phase: "STARTED" | "FINALIZED" = "FINALIZED"): Promise<RunningBuild> {
    // TODO Use David's Abstraction?
    const url = `https://webhook.atomist.com/atomist/jenkins/teams/${runningBuild.team}`;
    const data = {
        name: `Build ${runningBuild.repoRef.sha}`,
        duration: 3,
        build: {
            number: `Build ${runningBuild.repoRef.sha.substring(0, 7)}...`,
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
    return axios.post(url, data)
        .then(() => runningBuild);
}

function onExit(code: number, signal: any, rb: RunningBuild, team: string,
                artifactStore: ArtifactStore,
                log: ProgressLog): void {
    logger.info("Build exited with code=%d and signal %s", code, signal);
    if (code === 0) {
        onSuccess(rb, log)
            .then(id => linkArtifact(rb, team, artifactStore));
    } else {
        onFailure(rb, log);
    }
}

function linkArtifact(rb: RunningBuild, team: string, artifactStore: ArtifactStore): Promise<any> {
    return artifactStore.storeFile(rb.appInfo, rb.deploymentUnitFile)
        .then(imageUrl => postLinkImageWebhook(rb.repoRef.owner, rb.repoRef.repo, rb.repoRef.sha, imageUrl, team));
}
