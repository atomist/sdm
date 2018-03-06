import { HandlerResult, logger, Success } from "@atomist/automation-client";
import {
    ProjectOperationCredentials,
    TokenCredentials,
} from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import axios from "axios";
import { AddressChannels } from "../../../../../common/slack/addressChannels";
import { ArtifactStore } from "../../../../../spi/artifact/ArtifactStore";
import { Builder, PushThatTriggersBuild } from "../../../../../spi/build/Builder";
import { AppInfo } from "../../../../../spi/deploy/Deployment";
import { InterpretedLog, LogInterpreter } from "../../../../../spi/log/InterpretedLog";
import {
    LogFactory, ProgressLog,
} from "../../../../../spi/log/ProgressLog";
import { reportFailureInterpretation } from "../../../../../util/slack/reportFailureInterpretation";
import { postLinkImageWebhook } from "../../../../../util/webhook/ImageLink";

export interface LocalBuildInProgress {

    readonly buildResult: Promise<{ error: boolean, code: number }>;

    readonly repoRef: RemoteRepoRef;

    readonly team: string;

    /** Available once build is complete */
    readonly appInfo: AppInfo;

    readonly deploymentUnitFile: string;

    readonly url: string;
}

/**
 * Superclass for build implemented on the automation client itself, emitting appropriate events to Atomist.
 * Allows listening to a Running build
 */
export abstract class LocalBuilder implements Builder {

    constructor(private artifactStore: ArtifactStore,
                private logFactory: LogFactory) {
    }

    public async initiateBuild(creds: ProjectOperationCredentials,
                               id: RemoteRepoRef,
                               addressChannels: AddressChannels,
                               team: string, push: PushThatTriggersBuild): Promise<HandlerResult> {
        const as = this.artifactStore;
        const token = (creds as TokenCredentials).token;
        const log = await this.logFactory();
        const logInterpreter = this.logInterpreter;

        const rb = await this.startBuild(creds, id, team, log, addressChannels);
        const buildComplete: Promise<HandlerResult> = rb.buildResult.then(br => {
            if (!br.error) {
                return onExit(
                    token,
                    true,
                    rb, team, push.branch, as,
                    log,
                    addressChannels, logInterpreter)
                    .then(() => Success);
            } else {
                return onExit(
                    token,
                    false,
                    rb, team, push.branch, as,
                    log,
                    addressChannels, logInterpreter)
                    .then(() => ({code: 1}));
            }
        });
        await onStarted(rb, push.branch);
        return buildComplete;
    }

    public abstract logInterpreter(log: string): InterpretedLog | undefined;

    protected abstract startBuild(creds: ProjectOperationCredentials,
                                  id: RemoteRepoRef,
                                  team: string,
                                  log: ProgressLog,
                                  addressChannels: AddressChannels): Promise<LocalBuildInProgress>;
}

function onStarted(runningBuild: LocalBuildInProgress, branch: string) {
    return updateAtomistLifecycle(runningBuild, "started", branch);
}

export const NotARealUrl = "https://not.a.real.url";

function updateAtomistLifecycle(runningBuild: LocalBuildInProgress,
                                status: "started" | "failed" | "error" | "passed" | "canceled",
                                branch: string): Promise<LocalBuildInProgress> {
    logger.info(`Telling Atomist about a ${status} build on ${branch}, sha ${runningBuild.repoRef.sha}, url ${runningBuild.url}`);
    const url = `https://webhook.atomist.com/atomist/build/teams/${runningBuild.team}`;
    const data = {
        repository: {
            owner_name: runningBuild.repoRef.owner,
            name: runningBuild.repoRef.repo,
        },
        name: `Build ${runningBuild.repoRef.sha}`,
        type: "push",
        build_url: runningBuild.url,
        status,
        commit: runningBuild.repoRef.sha,
        branch,
        provider: "github-sdm-local",
    };
    return axios.post(url, data)
        .then(() => runningBuild);
}

async function onExit(token: string,
                      success: boolean,
                      rb: LocalBuildInProgress,
                      team: string,
                      branch: string,
                      artifactStore: ArtifactStore,
                      log: ProgressLog,
                      ac: AddressChannels,
                      logInterpreter: LogInterpreter): Promise<any> {
    try {
        if (success) {
            await updateAtomistLifecycle(rb, "passed", branch);
            if (!!rb.deploymentUnitFile) {
                await linkArtifact(token, rb, team, artifactStore);
            } else {
                logger.warn("No artifact generated by build of %j", rb.appInfo);
            }
        } else {
            await updateAtomistLifecycle(rb, "failed", branch);
            const interpretation = logInterpreter && !!log.log && logInterpreter(log.log);
            // The deployer might have information about the failure; report it in the channels
            if (interpretation) {
                await reportFailureInterpretation("build", interpretation,
                    {url: log.url, log: log.log}, rb.appInfo.id, ac);
            }
        }
    } finally {
        await log.close();
    }
}

function linkArtifact(token: string, rb: LocalBuildInProgress, team: string, artifactStore: ArtifactStore): Promise<any> {
    return artifactStore.storeFile(rb.appInfo, rb.deploymentUnitFile, {token})
        .then(imageUrl => postLinkImageWebhook(rb.repoRef.owner, rb.repoRef.repo, rb.repoRef.sha, imageUrl, team));
}
