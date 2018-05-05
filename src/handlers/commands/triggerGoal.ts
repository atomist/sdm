/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { HandleCommand, HandlerContext, MappedParameter, MappedParameters, Parameter, Secret, Secrets, Success } from "@atomist/automation-client";
import { Parameters } from "@atomist/automation-client/decorators";
import { guid } from "@atomist/automation-client/internal/util/string";
import { commandHandlerFrom } from "@atomist/automation-client/onCommand";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { Goal } from "../../common/delivery/goals/Goal";
import { GoalImplementation } from "../../common/delivery/goals/SdmGoalImplementationMapper";
import { constructSdmGoal, constructSdmGoalImplementation, storeGoal, updateGoal } from "../../common/delivery/goals/storeGoals";
import { findSdmGoalOnCommit } from "../../common/delivery/goals/support/fetchGoalsOnCommit";
import { goalKeyString } from "../../ingesters/sdmGoalIngester";
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

export function triggerGoal(implementationName: string, goal: Goal, implementation: GoalImplementation): HandleCommand {
    return commandHandlerFrom(triggerGoalsOnCommit(goal, implementation),
        RetryGoalParameters,
        retryCommandNameFor(goal),
        "Retry an execution of " + goal.name, goal.retryIntent);
}

export function retryCommandNameFor(goal: Goal) {
    return "Retry" + goal.uniqueCamelCaseName;
}

function triggerGoalsOnCommit(goal: Goal, implementation: GoalImplementation) {
    return async (ctx: HandlerContext, commandParams: RetryGoalParameters) => {
        // figure out which commit
        const repoData = await fetchDefaultBranchTip(ctx, commandParams);
        const branch = commandParams.branch || repoData.defaultBranch;
        const sha = commandParams.sha || tipOfBranch(repoData, branch);

        // figure out which goalSet
        const id = GitHubRepoRef.from({owner: commandParams.owner, repo: commandParams.repo, sha, branch});
        const thisGoal = await findSdmGoalOnCommit(ctx, id, commandParams.providerId, goal);
        if (!thisGoal) {
            await ctx.messageClient.respond(`Triggering '${goalKeyString(goal)}' for the first time on ${
                sha.substr(0, 7)}.`);
            await triggerNewGoal({context: ctx, goal, id, providerId: commandParams.providerId, implementation});
        } else {
            await ctx.messageClient.respond(`Requesting re-exectution of '${goalKeyString(goal)}' on ${
                sha.substr(0, 7)}.`);
            // do the thing
            await updateGoal(ctx, thisGoal,
                {
                    state: "requested",
                    description: "Manually reset",
                });
        }
        return Success;
    };
}

async function triggerNewGoal(params: {
    context: HandlerContext, goal: Goal, id: RemoteRepoRef, providerId: string,
    implementation: GoalImplementation,
}) {
    const goalSet = "manual-trigger";
    const goalSetId = guid();
    const {context, id, goal, providerId, implementation} = params;
    const fulfillment = constructSdmGoalImplementation(implementation);
    return storeGoal(context, constructSdmGoal(context, {
        goalSet,
        goalSetId,
        goal,
        state: "requested",
        id,
        providerId,
        fulfillment,
    }));
}

export async function fetchDefaultBranchTip(ctx: HandlerContext, repositoryId: { repo: string, owner: string, providerId: string }) {
    const result = await ctx.graphClient.query<RepoBranchTips.Query, RepoBranchTips.Variables>(
        {name: "RepoBranchTips", variables: {name: repositoryId.repo, owner: repositoryId.owner}});
    if (!result || !result.Repo || result.Repo.length === 0) {
        throw new Error(`Repository not found: ${repositoryId.owner}/${repositoryId.repo}`);
    }
    const repo = result.Repo.find(r => r.org.provider.providerId === repositoryId.providerId);
    if (!repo) {
        throw new Error(`Repository not found: ${repositoryId.owner}/${repositoryId.repo} provider ${repositoryId.providerId}`);
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
