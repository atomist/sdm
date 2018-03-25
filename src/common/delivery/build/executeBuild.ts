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
import { Builder } from "../../../spi/build/Builder";
import { OnAnyPendingStatus } from "../../../typings/types";
import { ProjectListenerInvocation } from "../../listener/Listener";
import { PushMapping } from "../../listener/PushMapping";
import { ProjectLoader } from "../../repo/ProjectLoader";
import { addressChannelsFor } from "../../slack/addressChannels";
import { ExecuteGoalInvocation, ExecuteGoalResult, GoalExecutor } from "../goals/goalExecution";

/**
 * Execute build with the appropriate builder
 * @param projectLoader used to load projects
 * @param builderMapping mapping to a builder
 */
export function executeBuild(projectLoader: ProjectLoader,
                             builderMapping: PushMapping<Builder>): GoalExecutor {
    return async (status: OnAnyPendingStatus.Status, context: HandlerContext, params: ExecuteGoalInvocation): Promise<ExecuteGoalResult> => {
        const commit = status.commit;
        await dedup(commit.sha, async () => {
            const credentials = {token: params.githubToken};
            const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);
            const atomistTeam = context.teamId;

            await projectLoader.doWithProject({credentials, id, context, readOnly: true}, async project => {
                const push = commit.pushes[0];
                const pti: ProjectListenerInvocation = {
                    id,
                    project,
                    credentials,
                    context,
                    addressChannels: addressChannelsFor(commit.repo, context),
                    push,
                };

                const builder = await builderMapping.valueForPush(pti);
                if (!builder) {
                    throw new Error(`Don't know how to build project ${id.owner}:${id.repo}`);
                }
                logger.info("Building project %s:%s with builder [%s]", id.owner, id.repo, builder.name);
                const allBranchesThisCommitIsOn = commit.pushes.map(p => p.branch);
                const theDefaultBranchIfThisCommitIsOnIt = allBranchesThisCommitIsOn.find(b => b === commit.repo.defaultBranch);
                const someBranchIDoNotReallyCare = allBranchesThisCommitIsOn.find(b => true);
                const branchToMarkTheBuildWith = theDefaultBranchIfThisCommitIsOnIt || someBranchIDoNotReallyCare || "master";

                // the builder is expected to result in a complete Build event (which will update the build status)
                // and an ImageLinked event (which will update the artifact status).
                return builder.initiateBuild(credentials, id, pti.addressChannels, atomistTeam, {branch: branchToMarkTheBuildWith});
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
