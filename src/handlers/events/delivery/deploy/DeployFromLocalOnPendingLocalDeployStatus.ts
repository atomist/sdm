/*
 * Copyright © 2017 Atomist, Inc.
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
    EventFired,
    EventHandler,
    failure,
    Failure,
    GraphQL,
    HandleEvent,
    HandlerContext,
    HandlerResult,
    logger,
    Secret,
    Secrets,
    Success,
} from "@atomist/automation-client";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { Goal, Goals } from "../../../../common/goals/Goal";
import { ConsoleProgressLog } from "../../../../common/log/progressLogs";
import { addressChannelsFor } from "../../../../common/slack/addressChannels";
import { SourceDeployer } from "../../../../spi/deploy/SourceDeployer";
import { OnPendingLocalDeployStatus } from "../../../../typings/types";
import {
    setDeployStatus,
    setEndpointStatus,
} from "./deploy";
import { ExecuteGoalInvocation, Executor, StatusForExecuteGoal } from "./ExecuteGoalOnSuccessStatus";

export function deployOnLocal(endpointGoal: Goal, deployer): Executor {
    return async (status: StatusForExecuteGoal.Status, ctx: HandlerContext, params: ExecuteGoalInvocation) => {
        const commit = status.commit;
        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);
        const log = ConsoleProgressLog;
        const addressChannels = addressChannelsFor(commit.repo, ctx);
        try {
            const deployment = await deployer.deployFromSource(
                id,
                addressChannels,
                log,
                {token: params.githubToken},
                ctx.teamId,
                status.commit.pushes[0].branch);
            await setDeployStatus(params.githubToken, id,
                "success",
                params.goal.context, undefined, params.goal.completedDescription);
            if (!!deployment.endpoint) {
                await setEndpointStatus(params.githubToken, id,
                    endpointGoal.context, deployment.endpoint, endpointGoal.completedDescription);
            }
            return Success;
        } catch (e) {
            logger.warn("Deployment failed: %s", e);
            await setDeployStatus(params.githubToken, id,
                "failure",
                params.goal.context, undefined, params.goal.workingDescription);
            return Failure;
        } finally {
            log.close();
        }
    };
}
