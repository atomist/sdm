/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
    Failure,
    HandlerResult,
    logger,
    Success,
} from "@atomist/automation-client";
import {
    ProjectOperationCredentials,
    TokenCredentials,
} from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { doWithRetry } from "@atomist/automation-client/util/retry";
import axios from "axios";
import { ArtifactStore } from "../../../../spi/artifact/ArtifactStore";
import {
    Builder,
    PushThatTriggersBuild,
} from "../../../../spi/build/Builder";
import { AppInfo } from "../../../../spi/deploy/Deployment";
import {
    InterpretedLog,
    LogInterpreter,
} from "../../../../spi/log/InterpretedLog";
import {
    LogFactory,
    ProgressLog,
} from "../../../../spi/log/ProgressLog";
import { ChildProcessResult } from "../../../../util/misc/spawned";
import { reportFailureInterpretation } from "../../../../util/slack/reportFailureInterpretation";
import { postLinkImageWebhook } from "../../../../util/webhook/ImageLink";
import { ProjectLoader } from "../../../repo/ProjectLoader";
import { AddressChannels } from "../../../slack/addressChannels";

export interface LocalBuildInProgress {

    readonly buildResult: Promise<ChildProcessResult>;

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

    constructor(public name: string,
                private readonly artifactStore: ArtifactStore,
                protected projectLoader: ProjectLoader) {
    }

    public async initiateBuild(creds: ProjectOperationCredentials,
                               id: RemoteRepoRef,
                               addressChannels: AddressChannels,
                               atomistTeam: string,
                               push: PushThatTriggersBuild,
                               log: ProgressLog): Promise<HandlerResult> {
        const as = this.artifactStore;
        const token = (creds as TokenCredentials).token;

        try {
            const rb = await this.startBuild(creds, id, atomistTeam, log, addressChannels);
            await this.onStarted(rb, push.branch);
            try {
                const br = await rb.buildResult;
                await this.onExit(
                    token,
                    !br.error,
                    rb, atomistTeam, push.branch, as);
                return Success;
            } catch (err) {
                await this.onExit(
                    token,
                    false,
                    rb, atomistTeam, push.branch, as);
                return Failure;
            }
        } catch (err) {
            // If we get here, the build failed before even starting
            logger.warn("Build on branch %s failed on start: %j - %s", push.branch, id, err.message);
            await this.updateAtomistLifecycle({repoRef: id, team: atomistTeam, url: undefined},
                "failed",
                push.branch);
            return Failure;
        }
    }

    /**
     * Implemented to interpret build logs
     * @param {string} log
     * @return {InterpretedLog}
     */
    public abstract logInterpreter: LogInterpreter;

    protected abstract startBuild(credentials: ProjectOperationCredentials,
                                  id: RemoteRepoRef,
                                  atomistTeam: string,
                                  log: ProgressLog,
                                  addressChannels: AddressChannels): Promise<LocalBuildInProgress>;

    protected onStarted(runningBuild: LocalBuildInProgress, branch: string) {
        return this.updateAtomistLifecycle(runningBuild, "started", branch);
    }

    protected async onExit(token: string,
                           success: boolean,
                           runningBuild: LocalBuildInProgress,
                           atomistTeam: string,
                           branch: string,
                           artifactStore: ArtifactStore): Promise<any> {
        try {
            if (success) {
                await this.updateAtomistLifecycle(runningBuild, "passed", branch);
                if (!!runningBuild.deploymentUnitFile) {
                    await linkArtifact(token, runningBuild, atomistTeam, artifactStore);
                } else {
                    logger.warn("No artifact generated by build of %j", runningBuild.appInfo);
                }
            } else {
                await this.updateAtomistLifecycle(runningBuild, "failed", branch);
            }
        } catch (err) {
            logger.warn("Unexpected build exit error: %s", err);
        }
    }

    protected updateAtomistLifecycle(runningBuild: { repoRef: RemoteRepoRef, url: string, team: string},
                                     status: "started" | "failed" | "error" | "passed" | "canceled",
                                     branch: string): Promise<any> {
        logger.info("Telling Atomist about a %s build on %s, sha %s, url %s",
            status, branch, runningBuild.repoRef.sha, runningBuild.url);
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
        return doWithRetry(
            () => axios.post(url, data),
            `Update build to ${JSON.stringify(status)}`)
            .then(() => runningBuild);
    }

}

function linkArtifact(token: string, rb: LocalBuildInProgress, team: string, artifactStore: ArtifactStore): Promise<any> {
    return artifactStore.storeFile(rb.appInfo, rb.deploymentUnitFile, {token})
        .then(imageUrl => postLinkImageWebhook(rb.repoRef.owner, rb.repoRef.repo, rb.repoRef.sha, imageUrl, team));
}
