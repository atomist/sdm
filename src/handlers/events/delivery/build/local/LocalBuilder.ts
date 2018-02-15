import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import {
    ProjectOperationCredentials,
    TokenCredentials,
} from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { createStatus } from "../../../../commands/editors/toclient/ghub";

import { HandlerContext } from "@atomist/automation-client";
import axios from "axios";
import { postLinkImageWebhook } from "../../../link/ImageLink";
import { ArtifactStore } from "../../ArtifactStore";
import { Builder, RunningBuild } from "../../Builder";
import { ProgressLog } from "../../log/ProgressLog";
import {BuiltContext, ContextToName} from "../../phases/httpServicePhases";

/**
 * Superclass for build, emitting appropriate events to Atomist
 */
export abstract class LocalBuilder implements Builder {

    constructor(private artifactStore: ArtifactStore) {
    }

    // TODO actually use progress log
    public build(creds: ProjectOperationCredentials, rr: RemoteRepoRef, team: string, log?: ProgressLog): Promise<RunningBuild> {
        const as = this.artifactStore;
        return this.startBuild(creds, rr, team)
            .then(rb => {
                rb.stream.addListener("exit", (code, signal) => onExit(code, signal, rb, team, creds, as))
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

function onExit(code: number, signal: any, rb: RunningBuild, team: string, creds: ProjectOperationCredentials, artifactStore: ArtifactStore): void {
    if (code === 0) {
        onSuccess(rb)
            .then(id => setBuiltContext(rb, team, creds, artifactStore));
    } else {
        onFailure(rb);
    }
}

function setBuiltContext(rb: RunningBuild, team: string, creds: ProjectOperationCredentials, artifactStore: ArtifactStore): Promise<any> {
    const id = rb.repoRef as GitHubRepoRef;
    return artifactStore.storeFile(rb.appInfo, rb.deploymentUnitFile)
        .then(imageUrl => postLinkImageWebhook(rb.repoRef.owner, rb.repoRef.repo, rb.repoRef.sha, imageUrl, team)
            .then(linked => createStatus((creds as TokenCredentials).token, id, {
                state: "success",
                target_url: imageUrl,
                context: BuiltContext,
                description: `Completed ${ContextToName[BuiltContext]}`,
            })));
}
