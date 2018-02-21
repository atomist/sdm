import {
    ProjectOperationCredentials,
    TokenCredentials
} from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import axios from "axios";
import { Readable } from "stream";
import { reportFailureInterpretation } from "../../../../../util/reportFailureInterpretation";
import { AddressChannels } from "../../../../commands/editors/toclient/addressChannels";
import { postLinkImageWebhook } from "../../../link/ImageLink";
import { ArtifactStore } from "../../ArtifactStore";
import { AppInfo } from "../../deploy/Deployment";
import EventEmitter = NodeJS.EventEmitter;
import { InterpretedLog, LogInterpretation, LogInterpreter } from "../../log/InterpretedLog";
import {
    LinkableLogFactory, LinkablePersistentProgressLog, ProgressLog,
    QueryableProgressLog,
} from "../../log/ProgressLog";
import { Builder } from "../Builder";
import { createRelease, createTag, Release, Tag, uploadReleaseAsset } from "../../../../commands/editors/toclient/ghub";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import * as fs from "fs";

export interface LocalBuildInProgress {

    readonly stream: EventEmitter;

    readonly repoRef: RemoteRepoRef;

    readonly team: string;

    /** Available once build is complete */
    readonly appInfo: AppInfo;

    readonly deploymentUnitStream: Readable;

    readonly deploymentUnitFile: string;

    readonly url: string;
}

/**
 * Superclass for build implemented on the automation client itself, emitting appropriate events to Atomist.
 * Allows listening to a Running build
 */
export abstract class LocalBuilder implements Builder {

    constructor(private artifactStore: ArtifactStore,
                private logFactory: LinkableLogFactory) {
    }

    public async initiateBuild(creds: ProjectOperationCredentials,
                               id: RemoteRepoRef,
                               addressChannels: AddressChannels,
                               team: string): Promise<LocalBuildInProgress> {
        const as = this.artifactStore;
        const token = (creds as TokenCredentials).token;
        const log = await this.logFactory();

        const rb = await this.startBuild(creds, id, team, log);
        rb.stream.addListener("exit", (code, signal) => onExit(
            token,
            code === 0, rb, team, as,
            log,
            addressChannels, this.logInterpreter))
            .addListener("error", (code, signal) => onExit(
                token,
                false, rb, team, as,
                log,
                addressChannels, this.logInterpreter));
        await onStarted(rb);
        return rb;
    }

    public abstract logInterpreter(log: string): InterpretedLog | undefined;

    protected abstract startBuild(creds: ProjectOperationCredentials, id: RemoteRepoRef,
                                  team: string, log: LinkablePersistentProgressLog): Promise<LocalBuildInProgress>;
}

function onStarted(runningBuild: LocalBuildInProgress) {
    return updateAtomistLifecycle(runningBuild, "STARTED", "STARTED");
}

function updateAtomistLifecycle(runningBuild: LocalBuildInProgress,
                                status: "STARTED" | "SUCCESS" | "FAILURE",
                                phase: "STARTED" | "FINALIZED" = "FINALIZED"): Promise<LocalBuildInProgress> {
    // TODO Use David's Abstraction?
    const url = `https://webhook.atomist.com/atomist/jenkins/teams/${runningBuild.team}`;
    const data = {
        name: `Build ${runningBuild.repoRef.sha}`,
        duration: 3,
        build: {
            number: `Build ${runningBuild.repoRef.sha.substring(0, 7)}...`,
            scm: {
                commit: runningBuild.repoRef.sha,
                // TODO why doesn't this work
                // url: runningBuild.url,
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

async function onExit(token: string,
                      success: boolean,
                      rb: LocalBuildInProgress, team: string,
                      artifactStore: ArtifactStore,
                      log: LinkablePersistentProgressLog & QueryableProgressLog,
                      ac: AddressChannels,
                      logInterpreter: LogInterpreter): Promise<any> {
    try {
        if (success) {
            await updateAtomistLifecycle(rb, "SUCCESS", "FINALIZED")
                .then(id => linkArtifact(token, rb, team, artifactStore));
        } else {
            const interpretation = logInterpreter && logInterpreter(log.log);
            // The deployer might have information about the failure; report it in the channels
            if (interpretation) {
                await reportFailureInterpretation("build", interpretation, log, rb.appInfo.id, ac);
            }
            await updateAtomistLifecycle(rb, "FAILURE", "FINALIZED");
        }
    } finally {
        await log.close();
    }
}

async function linkArtifact(token: string, rb: LocalBuildInProgress, team: string, artifactStore: ArtifactStore): Promise<any> {
    const tagName = rb.appInfo.version + new Date().getMilliseconds();
    const tag: Tag = {
        tag: tagName,
        message: rb.appInfo.version + " for release",
        object: rb.appInfo.id.sha,
        type: "commit",
        tagger: {
            name: "Atomist",
            email: "info@atomist.com",
            date: new Date().toISOString(),
        },
    };
    // TODO cast here is a bit nasty
    const grr = rb.appInfo.id as GitHubRepoRef;
    await createTag(token, grr, tag);
    const release: Release = {
        name: rb.appInfo.version,
        tag_name: tag.tag,
    };
    await createRelease(token, grr, release);
    const lastSlash = rb.deploymentUnitFile.lastIndexOf("/");
    const filename = rb.deploymentUnitFile.substr(lastSlash + 1);
    await uploadReleaseAsset(token, grr, release.name, filename, fs.createReadStream(rb.deploymentUnitFile));
    return artifactStore.storeFile(rb.appInfo, rb.deploymentUnitFile)
        .then(imageUrl => postLinkImageWebhook(rb.repoRef.owner, rb.repoRef.repo, rb.repoRef.sha, imageUrl, team));
}
