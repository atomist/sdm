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

import {
    configurationValue,
    HandlerContext,
    logger,
    QueryNoCacheOptions,
    RemoteRepoRef,
} from "@atomist/automation-client";
import * as stringify from "json-stringify-safe";
import * as _ from "lodash";
import { Goal } from "../../api/goal/Goal";
import { SdmGoalEvent } from "../../api/goal/SdmGoalEvent";
import {
    CommitForSdmGoal,
    PushForSdmGoal,
    SdmGoalFields,
    SdmGoalsForCommit,
    SdmGoalWithPushFields,
} from "../../typings/types";
import { goalKeyString } from "./sdmGoal";
import { goalCorrespondsToSdmGoal } from "./storeGoals";

export function fetchGoalsFromPush(sdmGoal: SdmGoalEvent): SdmGoalEvent[] {
    if (sdmGoal.push && (sdmGoal.push as any).goals) {
        const goals = _.cloneDeep(sumSdmGoalEvents((sdmGoal.push as any).goals.filter(g => g.goalSetId === sdmGoal.goalSetId)));
        const push = _.cloneDeep(sdmGoal.push);
        delete (push as any).goals;
        goals.forEach(g => g.push = push);
        return goals;
    }
    return [];
}

export async function findSdmGoalOnCommit(ctx: HandlerContext, id: RemoteRepoRef, providerId: string, goal: Goal): Promise<SdmGoalEvent> {
    const sdmGoals = await fetchGoalsForCommit(ctx, id, providerId);
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
                                            goal: SdmGoalWithPushFields.Fragment): Promise<CommitForSdmGoal.Commit> {
    const variables = { sha: goal.sha, repo: goal.repo.name, owner: goal.repo.owner, branch: goal.branch };
    const result = await ctx.graphClient.query<CommitForSdmGoal.Query, CommitForSdmGoal.Variables>(
        {
            name: "CommitForSdmGoal",
            variables: { sha: goal.sha, repo: goal.repo.name, owner: goal.repo.owner, branch: goal.branch },
            options: {
                ...QueryNoCacheOptions,
                log: configurationValue<boolean>("sdm.query.logging", false),
            },
        });
    if (!result || !result.Commit || result.Commit.length === 0) {
        throw new Error("No commit found for goal " + stringify(variables));
    }
    return result.Commit[0];
}

export async function fetchGoalsForCommit(ctx: HandlerContext,
                                          id: RemoteRepoRef,
                                          providerId: string,
                                          goalSetId?: string): Promise<SdmGoalEvent[]> {

    const result: SdmGoalsForCommit.SdmGoal[] = [];
    const size = 200;
    let offset = 0;

    const query = sdmGoalOffsetQuery(id, goalSetId, providerId, ctx);

    let pageResult = await query(offset, size);
    while (pageResult && pageResult.SdmGoal && pageResult.SdmGoal.length > 0) {
        result.push(...pageResult.SdmGoal);
        offset += size;
        pageResult = await query(offset, size);
    }

    if (!result) {
        throw new Error(`No result finding goals for commit ${providerId}/${id.owner}/${id.repo}#${id.sha} on ${id.branch}`);
    }
    if (result.length === 0) {
        logger.warn("0 goals found for commit %j, provider %s", id, providerId);
    }
    if (result.some(g => !g)) {
        logger.warn("Null or undefined goal found for commit %j, provider %s", id, providerId);
    }

    // only maintain latest version of SdmGoals from the current goal set
    const goals: SdmGoalEvent[] = sumSdmGoalEvents((result as any[]));

    // query for the push and add it in
    if (goals.length > 0) {
        const push = await ctx.graphClient.query<PushForSdmGoal.Query, PushForSdmGoal.Variables>({
            name: "PushForSdmGoal",
            variables: {
                owner: id.owner,
                repo: id.repo,
                providerId,
                branch: goals[0].branch,
                sha: goals[0].sha,
            },
            options: {
                log: configurationValue<boolean>("sdm.query.logging", false),
            },
        });
        return goals.map(g => {
            const goal = _.cloneDeep(g);
            goal.push = push.Commit[0].pushes[0];
            return goal;
        });
    }

    return goals;
}

export function sumSdmGoalEvents(some: SdmGoalEvent[]): SdmGoalEvent[] {
    // For some reason this won't compile with the obvious fix
    // tslint:disable-next-line:no-unnecessary-callback-wrapper
    const byKey = _.groupBy(some, sg => `${sg.goalSetId}-${goalKeyString(sg)}`);
    const summedGoals = Object.keys(byKey).map(k => sumEventsForOneSdmGoal(byKey[k]));
    return summedGoals;
}

function sumEventsForOneSdmGoal(events: SdmGoalEvent[]): SdmGoalEvent {
    if (events.length === 1) {
        return events[0];
    }
    // SUCCESS OVERRIDES ALL
    const success = events.find(e => e.state === "success");
    return success || _.maxBy(events, e => e.ts);
}

function sdmGoalOffsetQuery(id: RemoteRepoRef,
                            goalSetId: string,
                            providerId: string,
                            ctx: HandlerContext): (offset: number, size: number) => Promise<SdmGoalsForCommit.Query> {
    return async (offset: number, size: number) => {
        return ctx.graphClient.query<SdmGoalsForCommit.Query, SdmGoalsForCommit.Variables>({
            name: "SdmGoalsForCommit",
            variables: {
                owner: id.owner,
                repo: id.repo,
                branch: id.branch,
                sha: id.sha,
                providerId,
                goalSetId,
                qty: size,
                offset,
            },
            options: {
                ...QueryNoCacheOptions,
                log: configurationValue<boolean>("sdm.query.logging", false),
            },
        });
    };
}
