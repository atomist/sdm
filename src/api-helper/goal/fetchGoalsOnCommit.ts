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

import {
    HandlerContext,
    logger,
} from "@atomist/automation-client";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { QueryNoCacheOptions } from "@atomist/automation-client/spi/graph/GraphClient";
import * as stringify from "json-stringify-safe";
import * as _ from "lodash";
import { Goal } from "../../api/goal/Goal";
import { SdmGoal } from "../../api/goal/SdmGoal";
import {
    CommitForSdmGoal,
    SdmGoalFields,
    SdmGoalRepo,
    SdmGoalsForCommit,
} from "../../typings/types";
import { goalKeyString } from "./sdmGoal";
import { goalCorrespondsToSdmGoal } from "./storeGoals";

export async function findSdmGoalOnCommit(ctx: HandlerContext, id: RemoteRepoRef, providerId: string, goal: Goal): Promise<SdmGoal> {
    const sdmGoals = await fetchGoalsForCommit(ctx, id, providerId) as SdmGoal[];
    const matches = sdmGoals.filter(g => goalCorrespondsToSdmGoal(goal, g));
    if (matches && matches.length > 1) {
        logger.warn("More than one match found for %s/%s; they are %j", goal.environment, goal.name, matches);
    }
    if (matches.length === 0) {
        logger.debug("Did not find goal %s on commit %s#%s", goalKeyString(goal), id.repo, id.sha);
        return undefined;
    }
    return matches[0];
}

export async function fetchCommitForSdmGoal(ctx: HandlerContext,
                                            goal: SdmGoalFields.Fragment & SdmGoalRepo.Fragment): Promise<CommitForSdmGoal.Commit> {
    const variables = {sha: goal.sha, repo: goal.repo.name, owner: goal.repo.owner, branch: goal.branch};
    const result = await ctx.graphClient.query<CommitForSdmGoal.Query, CommitForSdmGoal.Variables>(
        {
            options: QueryNoCacheOptions,
            name: "CommitForSdmGoal",
            variables: {sha: goal.sha, repo: goal.repo.name, owner: goal.repo.owner, branch: goal.branch},
        });
    if (!result || !result.Commit || result.Commit.length === 0) {
        throw new Error("No commit found for goal " + stringify(variables));
    }
    return result.Commit[0];
}

export async function fetchGoalsForCommit(ctx: HandlerContext,
                                          id: RemoteRepoRef,
                                          providerId: string,
                                          goalSetId?: string): Promise<SdmGoalsForCommit.SdmGoal[]> {
    const result = await ctx.graphClient.query<SdmGoalsForCommit.Query, SdmGoalsForCommit.Variables>({
        name: "SdmGoalsForCommit",
        variables: {
            owner: id.owner,
            repo: id.repo,
            branch: id.branch,
            sha: id.sha,
            providerId,
            qty: 200,
        },
        options: QueryNoCacheOptions,
    });
    if (!result || !result.SdmGoal) {
        throw new Error(`No result finding goals for commit ${providerId}/${id.owner}/${id.repo}#${id.sha} on ${id.branch}`);
    }
    if (result.SdmGoal.length === 0) {
        logger.warn("0 goals found for commit %j, provider %s", id, providerId);
    }
    if (result.SdmGoal.some(g => !g)) {
        logger.warn("Null or undefined goal found for commit %j, provider %s", id, providerId);
    }
    if (result.SdmGoal.length === 200) {
        logger.warn("Watch out! There may be more goals than this. We only retrieve 200.");
        // automation-api#399 paging is not well-supported yet
    }

    // only maintain latest version of SdmGoals from the current goal set
    const goals: SdmGoalsForCommit.SdmGoal[] =
        sumSdmGoalEvents((result.SdmGoal as SdmGoal[]).filter(g => !goalSetId || g.goalSetId === goalSetId));
    logger.debug("summed goals: ", stringify(goals));

    return goals;
}

export function sumSdmGoalEvents(some: SdmGoal[]): SdmGoal[] {
    // For some reason this won't compile with the obvious fix
    // tslint:disable-next-line:no-unnecessary-callback-wrapper
    const byKey = _.groupBy(some, sg => goalKeyString(sg));
    const summedGoals = Object.keys(byKey).map(k => sumEventsForOneSdmGoal(byKey[k]));
    return summedGoals;
}

function sumEventsForOneSdmGoal(events: SdmGoal[]): SdmGoal {
    if (events.length === 1) {
        return events[0];
    }
    // SUCCESS OVERRIDES ALL
    const success = events.find(e => e.state === "success");
    return success || _.maxBy(events, e => e.ts);
}
