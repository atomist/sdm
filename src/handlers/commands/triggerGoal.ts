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

import { HandleCommand, HandlerContext, MappedParameter, MappedParameters, Parameter, Secret, Secrets, Success } from "@atomist/automation-client";
import { Parameters } from "@atomist/automation-client/decorators";
import { commandHandlerFrom } from "@atomist/automation-client/onCommand";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { Goal } from "../../common/delivery/goals/Goal";
import { updateGoal } from "../../common/delivery/goals/storeGoals";
import { findSdmGoalOnCommit } from "../../common/delivery/goals/support/fetchGoalsOnCommit";
import { goalKeyString, SdmGoal } from "../../ingesters/sdmGoalIngester";
import { RepoBranchTips } from "../../typings/types";

@Parameters()
export class RetryGoalParameters {

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

    @Parameter({required: false})
    public goalSet: string;
}

export function triggerGoal(implementationName: string, goal: Goal): HandleCommand {
    return commandHandlerFrom(triggerGoalsOnCommit(goal),
        RetryGoalParameters,
        retryCommandNameFor(goal),
        "Retry an execution of " + goal.name, goal.retryIntent);
}

export function retryCommandNameFor(goal: Goal) {
    return "Retry" + goal.uniqueCamelCaseName;
}

function triggerGoalsOnCommit(goal: Goal) {
    return async (ctx: HandlerContext, commandParams: RetryGoalParameters) => {
        // figure out which commit
        const repoData = await fetchDefaultBranchTip(ctx, new GitHubRepoRef(commandParams.owner, commandParams.repo), commandParams.providerId);
        const branch = commandParams.branch || repoData.defaultBranch;
        const sha = commandParams.sha || tipOfBranch(repoData, branch);

        // figure out which goalSet
        const id = GitHubRepoRef.from({owner: commandParams.owner, repo: commandParams.repo, sha, branch});
        const thisGoal = await findSdmGoalOnCommit(ctx, id, commandParams.providerId, goal);
        if (!thisGoal) {
                await ctx.messageClient.respond(`The goal '${goalKeyString(goal)}' does not exist on ${
                    sha.substr(0, 7)}. Ask Jess to implement this`);
                return {code: 0};
            }

        // do the thing
        await updateGoal(ctx, thisGoal,
            {
                state: "requested",
                description: "Manually reset",
            });
        return Success;
    };
}

export async function fetchDefaultBranchTip(ctx: HandlerContext, id: GitHubRepoRef, providerId: string) {
    const result = await ctx.graphClient.query<RepoBranchTips.Query, RepoBranchTips.Variables>(
        {name: "RepoBranchTips", variables: {name: id.repo, owner: id.owner}});
    if (!result || !result.Repo || result.Repo.length === 0) {
        throw new Error(`Repository not found: ${id.owner}/${id.repo}`);
    }
    const repo = result.Repo.find(r => r.org.provider.providerId === providerId);
    if (!repo) {
        throw new Error(`Repository not found: ${id.owner}/${id.repo} provider ${providerId}`);
    }
    return repo;
}

export function tipOfBranch(repo: RepoBranchTips.Repo, branchName: string) {
    const branchData = repo.branches.find(b => b.name === branchName);
    if (!branchData) {
        throw new Error("Branch not found: " + branchName);
    }
    return branchData.commit.sha;
}
