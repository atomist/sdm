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
    Failure, HandleCommand, HandlerContext, MappedParameter, MappedParameters, Parameter, Secret, Secrets,
    Success,
} from "@atomist/automation-client";
import { Parameters } from "@atomist/automation-client/decorators";
import { commandHandlerFrom } from "@atomist/automation-client/onCommand";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import * as stringify from "json-stringify-safe";
import { GoalSetter } from "../../../common/listener/GoalSetter";
import { GoalsSetListener } from "../../../common/listener/GoalsSetListener";
import { ProjectLoader } from "../../../common/repo/ProjectLoader";
import { fetchDefaultBranchTip, tipOfBranch } from "../../../handlers/commands/triggerGoal";
import { chooseAndSetGoals } from "../../../handlers/events/delivery/goals/SetGoalsOnPush";
import { PushForCommit } from "../../../typings/types";

@Parameters()
export class ResetGoalsParameters {

    @Secret(Secrets.UserToken)
    public githubToken: string;

    @MappedParameter(MappedParameters.GitHubOwner)
    public owner: string;

    @MappedParameter(MappedParameters.GitHubRepository)
    public repo: string;

    @MappedParameter(MappedParameters.GitHubRepositoryProvider)
    public providerId: string;

    @Parameter({required: false})
    public sha: string;

    @Parameter({required: false})
    public branch: string;

}

export function resetGoalsCommand(projectLoader: ProjectLoader, goalsListeners: GoalsSetListener[], goalSetters: GoalSetter[]): HandleCommand {
    return commandHandlerFrom(resetGoalsOnCommit(projectLoader, goalsListeners, goalSetters),
        ResetGoalsParameters,
        "ResetGoalsOnCommit",
        "Set goals",
        "reset goals");
}

function resetGoalsOnCommit(projectLoader: ProjectLoader, goalsListeners: GoalsSetListener[], goalSetters: GoalSetter[]) {
    return async (ctx: HandlerContext, commandParams: ResetGoalsParameters) => {
        // figure out which commit
        const repoData = await fetchDefaultBranchTip(ctx, new GitHubRepoRef(commandParams.owner, commandParams.repo), commandParams.providerId);
        const branch = commandParams.branch || repoData.defaultBranch;
        const sha = commandParams.sha || tipOfBranch(repoData, branch);
        const commitResult = await ctx.graphClient.query<PushForCommit.Query, PushForCommit.Variables>({
            name: "PushForCommit", variables: {
                owner: commandParams.owner, repo: commandParams.repo, providerId: commandParams.providerId, branch, sha,
            },
        });

        if (!commitResult || !commitResult.Commit || commitResult.Commit.length === 0) {
            await ctx.messageClient.respond("Could not find commit for " + stringify(commandParams));
            return Failure;
        }
        const commit = commitResult.Commit[0];
        if (!commit.pushes || commit.pushes.length === 0) {
            await ctx.messageClient.respond("Could not find push for " + stringify(commandParams));
            return Failure;
        }

        const credentials = {token: commandParams.githubToken};

        const goals = await chooseAndSetGoals(ctx, projectLoader, credentials, commit.pushes[0], goalsListeners, goalSetters);

        if (goals) {
            await ctx.messageClient.respond(`Set goals on ${sha} to ${goals.name}`);
        } else {
            await ctx.messageClient.respond(`No goals found for ${sha}`);
        }

        return Success;
    };
}
