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
    HandlerResult,
    logger,
    Success,
} from "@atomist/automation-client";
import {
    ProjectOperationCredentials,
    TokenCredentials,
} from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
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
import { reportFailureInterpretation } from "../../../../util/slack/reportFailureInterpretation";
import { postLinkImageWebhook } from "../../../../util/webhook/ImageLink";
import { AddressChannels } from "../../../slack/addressChannels";

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

    constructor(public name: string,
                private artifactStore: ArtifactStore,
                private logFactory: LogFactory) {
    }

    public async initiateBuild(creds: ProjectOperationCredentials,
                               id: RemoteRepoRef,
                               addressChannels: AddressChannels,
                               atomistTeam: string, push: PushThatTriggersBuild): Promise<HandlerResult> {
        const as = this.artifactStore;
        const token = (creds as TokenCredentials).token;
        const log = await this.logFactory();
        const logInterpreter = this.logInterpreter;

        const rb = await this.startBuild(creds, id, atomistTeam, log, addressChannels);
        const buildComplete: Promise<HandlerResult> = rb.buildResult.then(br => {
            if (!br.error) {
                return this.onExit(
                    token,
                    true,
                    rb, atomistTeam, push.branch, as,
                    log,
                    addressChannels, logInterpreter)
                    .then(() => Success);
            } else {
                return this.onExit(
                    token,
                    false,
                    rb, atomistTeam, push.branch, as,
                    log,
                    addressChannels, logInterpreter)
                    .then(() => ({code: 1}));
            }
        });
        await this.onStarted(rb, push.branch);
        return buildComplete;
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
                           artifactStore: ArtifactStore,
                           log: ProgressLog,
                           ac: AddressChannels,
                           logInterpreter: LogInterpreter): Promise<any> {
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
                const interpretation = logInterpreter && !!log.log && logInterpreter(log.log);
                // The deployer might have information about the failure; report it in the channels
                if (interpretation) {
                    await reportFailureInterpretation("build", interpretation,
                        {url: log.url, log: log.log}, runningBuild.appInfo.id, ac);
                }
            }
        } finally {
            await log.close();
        }
    }

    protected updateAtomistLifecycle(runningBuild: LocalBuildInProgress,
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

}

export const NotARealUrl = "https://not.a.real.url";

function linkArtifact(token: string, rb: LocalBuildInProgress, team: string, artifactStore: ArtifactStore): Promise<any> {
    return artifactStore.storeFile(rb.appInfo, rb.deploymentUnitFile, {token})
        .then(imageUrl => postLinkImageWebhook(rb.repoRef.owner, rb.repoRef.repo, rb.repoRef.sha, imageUrl, team));
}
