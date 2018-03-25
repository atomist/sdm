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

import { HandlerContext, logger, Success } from "@atomist/automation-client";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { ArtifactStore } from "../../../spi/artifact/ArtifactStore";
import { OnAnyPendingStatus } from "../../../typings/types";
import { ProjectListenerInvocation } from "../../listener/Listener";
import { PushMapping } from "../../listener/PushMapping";
import { ConsoleProgressLog } from "../../log/progressLogs";
import { ProjectLoader } from "../../repo/ProjectLoader";
import { addressChannelsFor } from "../../slack/addressChannels";
import { Goal } from "../goals/Goal";
import { ExecuteGoalInvocation, ExecuteGoalResult, GoalExecutor } from "../goals/goalExecution";
import { deploy, DeployArtifactParams, Target } from "./deploy";

import * as _ from "lodash";

/**
 * Execute deploy with the appropriate deployer and target from the underlying push
 * @param projectLoader used to load projects
 * @param deployMapping mapping to a builder
 */
export function executeArtifactDeploy(artifactStore: ArtifactStore,
                                      projectLoader: ProjectLoader,
                                      deployGoal: Goal,
                                      endpointGoal: Goal,
                                      targetMapping: PushMapping<Target<any>>): GoalExecutor {
    return async (status: OnAnyPendingStatus.Status, context: HandlerContext, params: ExecuteGoalInvocation): Promise<ExecuteGoalResult> => {
        const commit = status.commit;
        await dedup(commit.sha, async () => {
            const credentials = {token: params.githubToken};
            const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);
            const atomistTeam = context.teamId;
            const addressChannels = addressChannelsFor(commit.repo, context);

            await projectLoader.doWithProject({credentials, id, context, readOnly: true}, async project => {
                const push = commit.pushes[0];
                const pti: ProjectListenerInvocation = {
                    id,
                    project,
                    credentials,
                    context,
                    addressChannels,
                    push,
                };

                const target = await targetMapping.valueForPush(pti);
                if (!target) {
                    throw new Error(`Don't know how to deploy project ${id.owner}:${id.repo}`);
                }
                logger.info("Deploying project %s:%s with target [%j]", id.owner, id.repo, target);
                const dap: DeployArtifactParams<any> = {
                    id,
                    credentials,
                    addressChannels,
                    team: atomistTeam,
                    deployGoal,
                    endpointGoal,
                    artifactStore,
                    ...target,
                    targetUrl: _.get(commit, "image.imageName"),
                    // Fix this
                    progressLog: new ConsoleProgressLog(),
                    branch: push.branch,
                };
                return deploy(dap);
            });
        });
        return Success;
    };
}

async function dedup<T>(key: string, f: () => Promise<T>): Promise<T | void> {
    if (running[key]) {
        logger.warn("This op was called twice for " + key);
        return Promise.resolve();
    }
    running[key] = true;
    const promise = f().then(t => {
        running[key] = undefined;
        return t;
    });
    return promise;
}

const running = {};
