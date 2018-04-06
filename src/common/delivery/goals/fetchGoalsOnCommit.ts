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

import { HandlerContext, logger } from "@atomist/automation-client";
import { CommitForSdmGoal, SdmGoalFields, SdmGoalRepo, SdmGoalsForCommit } from "../../../typings/types";

import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { NoCacheOptions } from "@atomist/automation-client/spi/graph/GraphClient";
import * as _ from "lodash";
import { SdmGoal } from "../../../ingesters/sdmGoalIngester";
import { Goal } from "./Goal";
import { goalCorrespondsToSdmGoal } from "./storeGoals";
import * as stringify from "json-stringify-safe";

export async function findSdmGoalOnCommit(ctx: HandlerContext, id: RemoteRepoRef, providerId: string, goal: Goal): Promise<SdmGoal> {
    const sdmGoals = await fetchGoalsForCommit(ctx, id, providerId);
    const matches = sdmGoals.filter(g => goalCorrespondsToSdmGoal(goal, g as SdmGoal));
    if (matches && matches.length > 1) {
        logger.warn("FindSdmGoal: More than one match found for %s/%s; they are %j", goal.environment, goal.name, matches);
    }
    return _.get(matches, "[0]");
}

export async function fetchGoalsForCommit(ctx: HandlerContext, id: RemoteRepoRef, providerId: string): Promise<SdmGoalsForCommit.SdmGoal[]> {
    const result = await ctx.graphClient.query<SdmGoalsForCommit.Query, SdmGoalsForCommit.Variables>({
        name: "SdmGoalsForCommit", variables: {
            owner: id.owner,
            repo: id.repo,
            branch: id.branch,
            sha: id.sha,
            providerId,
            qty: 20,
        },
        options: NoCacheOptions,
    });
    if (!result || !result.SdmGoal) {
        throw new Error(`No result finding goals for commit ${providerId}/${id.owner}/${id.repo}#${id.sha} on ${id.branch}`);
    }
    if (result.SdmGoal.length === 0) {
        logger.warn("0 goals found for commit %j, provider %s", id, providerId);
    }
    if (result.SdmGoal.some(g => !g)) {
        logger.warn("Internal error: Null or undefined goal found for commit %j, provider %s", id, providerId);
    }
    if (result.SdmGoal.length === 20) {
        logger.warn("Watch out! There may be more goals than this. We only retrieve 20.");
        // automation-api#399 paging is not well-supported yet
    }

    return _.flatten(result.SdmGoal);
}


export async function fetchCommitForSdmGoal(ctx: HandlerContext, goal: SdmGoalFields.Fragment & SdmGoalRepo.Fragment): Promise<CommitForSdmGoal.Commit> {
    const variables = {sha: goal.sha, repo: goal.repo.name, owner: goal.repo.owner, branch: goal.branch};
    const result = await ctx.graphClient.query<CommitForSdmGoal.Query, CommitForSdmGoal.Variables>(
        {
            options: NoCacheOptions,
            name: "CommitForSdmGoal",
            variables: {sha: goal.sha, repo: goal.repo.name, owner: goal.repo.owner, branch: goal.branch}});
    if (!result || !result.Commit || result.Commit.length === 0) {
        throw new Error("No commit found for goal " + stringify(variables));
    }
    return result.Commit[0];
}