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
import { commandHandlerFrom } from "@atomist/automation-client/onCommand";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import * as stringify from "json-stringify-safe";
import { chooseAndSetGoals } from "../../../../api-helper/goal/chooseAndSetGoals";
import { SdmGoalImplementationMapper } from "../../../../api/goal/support/SdmGoalImplementationMapper";
import { GoalsSetListener } from "../../../../api/listener/GoalsSetListener";
import { GoalSetter } from "../../../../api/mapping/GoalSetter";
import { ProjectLoader } from "../../../../spi/project/ProjectLoader";
import { RepoRefResolver } from "../../../../spi/repo-ref/RepoRefResolver";
import { PushFields, PushForCommit, RepoBranchTips } from "../../../../typings/types";

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

export function resetGoalsCommand(rules: {
    projectLoader: ProjectLoader,
    repoRefResolver: RepoRefResolver,
    goalsListeners: GoalsSetListener[],
    goalSetter: GoalSetter,
    implementationMapping: SdmGoalImplementationMapper,
}): HandleCommand {
    return commandHandlerFrom(resetGoalsOnCommit(rules),
        ResetGoalsParameters,
        "ResetGoalsOnCommit",
        "Set goals",
        "reset goals");
}

function resetGoalsOnCommit(rules: {
    projectLoader: ProjectLoader,
    repoRefResolver: RepoRefResolver,
    goalsListeners: GoalsSetListener[],
    goalSetter: GoalSetter,
    implementationMapping: SdmGoalImplementationMapper,
}) {
    const {projectLoader, goalsListeners, goalSetter, implementationMapping, repoRefResolver} = rules;
    return async (ctx: HandlerContext, commandParams: ResetGoalsParameters) => {
        // figure out which commit
        const repoData = await fetchDefaultBranchTip(ctx, commandParams);
        const branch = commandParams.branch || repoData.defaultBranch;
        const sha = commandParams.sha || tipOfBranch(repoData, branch);
        const id = GitHubRepoRef.from({owner: commandParams.owner, repo: commandParams.repo, sha, branch});

        const push = await fetchPushForCommit(ctx, id, commandParams.providerId);
        const credentials = {token: commandParams.githubToken};

        const goals = await chooseAndSetGoals({
            projectLoader,
            repoRefResolver,
            goalsListeners,
            goalSetter,
            implementationMapping,
        }, {
            context: ctx,
            credentials,
            push,
        });

        if (goals) {
            await ctx.messageClient.respond(`Set goals on ${sha} to ${goals.name}`);
        } else {
            await ctx.messageClient.respond(`No goals found for ${sha}`);
        }

        return Success;
    };
}

export async function fetchPushForCommit(context: HandlerContext, id: RemoteRepoRef, providerId: string): Promise<PushFields.Fragment> {
    const commitResult = await context.graphClient.query<PushForCommit.Query, PushForCommit.Variables>({
        name: "PushForCommit", variables: {
            owner: id.owner, repo: id.repo, providerId, branch: id.branch, sha: id.sha,
        },
    });

    if (!commitResult || !commitResult.Commit || commitResult.Commit.length === 0) {
        throw new Error("Could not find commit for " + stringify(id));
    }
    const commit = commitResult.Commit[0];
    if (!commit.pushes || commit.pushes.length === 0) {
        throw new Error("Could not find push for " + stringify(id));
    }
    return commit.pushes[0];
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
