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
    HandlerContext,
    HandlerResult,
    logger,
    Success
} from "@atomist/automation-client";
import { ProjectOperationCredentials, TokenCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { QueryNoCacheOptions } from "@atomist/automation-client/spi/graph/GraphClient";
import { doWithRetry } from "@atomist/automation-client/util/retry";
import axios from "axios";
import { sprintf } from "sprintf-js";
import { ArtifactStore } from "../../../../spi/artifact/ArtifactStore";
import { Builder, PushThatTriggersBuild } from "../../../../spi/build/Builder";
import { AppInfo } from "../../../../spi/deploy/Deployment";
import { LogInterpreter } from "../../../../spi/log/InterpretedLog";
import { ProgressLog } from "../../../../spi/log/ProgressLog";
import { LastBuildOnRepo } from "../../../../typings/types";
import { ChildProcessResult } from "../../../../util/misc/spawned";
import { postLinkImageWebhook } from "../../../../util/webhook/ImageLink";
import { ProjectLoader } from "../../../repo/ProjectLoader";
import { AddressChannels } from "../../../slack/addressChannels";
import * as _ from "lodash";
import { createTagForStatus } from "../executeTag";
import { readSdmVersion } from "./projectVersioner";

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

    public async initiateBuild(credentials: ProjectOperationCredentials,
                               id: RemoteRepoRef,
                               addressChannels: AddressChannels,
                               push: PushThatTriggersBuild,
                               log: ProgressLog,
                               context: HandlerContext): Promise<HandlerResult> {
        const as = this.artifactStore;
        const atomistTeam = context.teamId;
        const buildNo = await this.obtainBuildNo(id, context);

        try {
            const rb = await this.startBuild(credentials, id, atomistTeam, log, addressChannels);
            await this.onStarted(rb, push.branch, buildNo);
            try {
                const br = await rb.buildResult;
                await this.onExit(
                    credentials,
                    id,
                    !br.error,
                    push,
                    rb,
                    buildNo,
                    as,
                    context);
                return br.error ? Failure : Success;
            } catch (err) {
                await this.onExit(
                    credentials,
                    id,
                    false,
                    push,
                    rb,
                    buildNo,
                    as,
                    context);
                return Failure;
            }
        } catch (err) {
            // If we get here, the build failed before even starting
            logger.warn("Build on branch %s failed on start: %j - %s", push.branch, id, err.message);
            log.write(sprintf("Build on branch %s failed on start: %j - %s", push.branch, id, err.message));
            await this.updateBuildStatus({repoRef: id, team: atomistTeam, url: undefined},
                "failed",
                push.branch,
                buildNo);
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

    protected onStarted(runningBuild: LocalBuildInProgress, branch: string, buildNo: string) {
        return this.updateBuildStatus(runningBuild, "started", branch, buildNo);
    }

    protected async onExit(credentials: ProjectOperationCredentials,
                           id: RemoteRepoRef,
                           success: boolean,
                           push: PushThatTriggersBuild,
                           runningBuild: LocalBuildInProgress,
                           buildNo: string,
                           artifactStore: ArtifactStore,
                           context: HandlerContext): Promise<any> {
        try {
            if (success) {
                await this.updateBuildStatus(runningBuild, "passed", push.branch, buildNo);
                await this.createBuildTag(id, push, buildNo, context, credentials);
                if (!!runningBuild.deploymentUnitFile) {
                    await linkArtifact((credentials as TokenCredentials).token,
                        runningBuild, context.teamId, artifactStore);
                } else {
                    logger.warn("No artifact generated by build of %j", runningBuild.appInfo);
                }
            } else {
                await this.updateBuildStatus(runningBuild, "failed", push.branch, buildNo);
            }
        } catch (err) {
            logger.warn("Unexpected build exit error: %s", err);
        }
    }

    protected updateBuildStatus(runningBuild: { repoRef: RemoteRepoRef, url: string, team: string },
                                status: "started" | "failed" | "error" | "passed" | "canceled",
                                branch: string,
                                buildNo: string): Promise<any> {
        logger.info("Telling Atomist about a %s build on %s, sha %s, url %s",
            status, branch, runningBuild.repoRef.sha, runningBuild.url);
        const url = `https://webhook.atomist.com/atomist/build/teams/${runningBuild.team}`;
        const data = {
            repository: {
                owner_name: runningBuild.repoRef.owner,
                name: runningBuild.repoRef.repo,
            },
            name: `Build #${buildNo}`,
            number: +buildNo,
            type: "push",
            build_url: runningBuild.url,
            status,
            commit: runningBuild.repoRef.sha,
            branch,
            provider: "sdm",
        };
        return doWithRetry(
            () => axios.post(url, data),
            `Update build to ${JSON.stringify(status)}`)
            .then(() => runningBuild);
    }

    protected obtainBuildNo(id: RemoteRepoRef, ctx: HandlerContext): Promise<string> {
        return ctx.graphClient.query<LastBuildOnRepo.Query, LastBuildOnRepo.Variables>({
                name: "LastBuildOnRepo",
                variables: {
                    owner: id.owner,
                    name: id.repo,
                },
                options: QueryNoCacheOptions,
            }).then(result => {
                const no = _.get(result, "Build[0].name") || "0";
                return (+no + 1).toString();
            });
    }

    protected async createBuildTag(id: RemoteRepoRef,
                                   push: PushThatTriggersBuild,
                                   buildNo: string,
                                   context: HandlerContext,
                                   credentials: ProjectOperationCredentials) {
        const version = await readSdmVersion(push.owner, push.name, push.providerId, push.sha, context);
        if (version) {
            await createTagForStatus(
                id,
                push.sha,
                "Tag created by SDM",
                `${version}+sdm.${buildNo}`,
                credentials);
        }
    }

}

function linkArtifact(token: string, rb: LocalBuildInProgress, team: string, artifactStore: ArtifactStore): Promise<any> {
    return artifactStore.storeFile(rb.appInfo, rb.deploymentUnitFile, {token})
        .then(imageUrl => postLinkImageWebhook(rb.repoRef.owner, rb.repoRef.repo, rb.repoRef.sha, imageUrl, team));
}

