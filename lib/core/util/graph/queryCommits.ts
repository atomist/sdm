/*
 * Copyright © 2019 Atomist, Inc.
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

import { HandlerContext } from "@atomist/automation-client/lib/HandlerContext";
import { RemoteRepoRef } from "@atomist/automation-client/lib/operations/common/RepoId";
import * as stringify from "json-stringify-safe";
import {
    PushFields,
    PushForCommit,
    RepoBranchTips,
} from "../../../typings/types";

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

export async function fetchBranchTips(ctx: HandlerContext,
                                      repositoryId: { repo: string, owner: string, providerId: string }): Promise<RepoBranchTips.Repo> {
    const result = await ctx.graphClient.query<RepoBranchTips.Query, RepoBranchTips.Variables>(
        { name: "RepoBranchTips", variables: { name: repositoryId.repo, owner: repositoryId.owner } });
    if (!result || !result.Repo || result.Repo.length === 0) {
        throw new Error(`Repository not found: ${repositoryId.owner}/${repositoryId.repo}`);
    }
    const repo = result.Repo.find(r => r.org.provider.providerId === repositoryId.providerId);
    if (!repo) {
        throw new Error(`Repository not found: ${repositoryId.owner}/${repositoryId.repo} provider ${repositoryId.providerId}`);
    }
    return repo;
}

export function tipOfBranch(repo: RepoBranchTips.Repo, branchName: string): string {
    const branchData = repo.branches.find(b => b.name === branchName);
    if (!branchData) {
        throw new Error("Branch not found: " + branchName);
    }
    return branchData.commit.sha;
}
