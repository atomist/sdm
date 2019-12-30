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

import { AutomationContextAware } from "@atomist/automation-client/lib/HandlerContext";
import { toStringArray } from "@atomist/automation-client/lib/internal/util/string";
import { QueryNoCacheOptions } from "@atomist/automation-client/lib/spi/graph/GraphClient";
import { codeLine } from "@atomist/slack-messages";
import * as _ from "lodash";
import {
    CancelOptions,
    DefaultCancelOptions,
} from "../../api/goal/common/Cancel";
import { ExecuteGoal } from "../../api/goal/GoalInvocation";
import { isGoals } from "../../api/goal/Goals";
import {
    SdmGoalByShaAndBranch,
    SdmGoalState,
} from "../../typings/types";
import { sumSdmGoalEvents } from "../goal/fetchGoalsOnCommit";
import { storeGoal } from "../goal/storeGoals";

/**
 * Cancel any pending goals that are on the previous commit of the goal's branch
 * @param options
 * @param name
 */
export function executeCancelGoalSets(options: CancelOptions, name: string): ExecuteGoal {
    return async gi => {

        const { goalEvent } = gi;

        if (!goalEvent.push.before) {
            return {
                code: 0,
                description: `No goals canceled \u00B7 first push on branch`,
            };
        }

        const registration = gi.configuration.name;
        const optsToUse: CancelOptions = {
            goalFilter: DefaultCancelOptions.goalFilter,
            ...options,
        };

        const goals = await gi.context.graphClient.query<SdmGoalByShaAndBranch.Query, SdmGoalByShaAndBranch.Variables>({
            name: "SdmGoalByShaAndBranch",
            variables: {
                sha: goalEvent.push.before.sha,
                branch: goalEvent.branch,
                repo: goalEvent.repo.name,
                owner: goalEvent.repo.owner,
                providerId: goalEvent.repo.providerId,
                uniqueNames: _.uniq(_.flatten(optsToUse.goals.map(g => {
                    if (isGoals(g)) {
                        return g.goals.map(gg => gg.uniqueName);
                    } else {
                        return g.uniqueName;
                    }
                }))),
                names: toStringArray(optsToUse.goalNames || []),
            },
            options: QueryNoCacheOptions,
        });

        if (goals && goals.SdmGoal && goals.SdmGoal.length > 0) {
            const currentGoals = sumSdmGoalEvents(goals.SdmGoal as any) as SdmGoalByShaAndBranch.SdmGoal[];
            const cancelableGoals = currentGoals.filter(g => provenanceFilter(g, registration))
                .filter(g => optsToUse.goalFilter(g as any));

            if (cancelableGoals.length > 0) {
                const canceledGoalSets = _.uniq(cancelableGoals.map(g => g.goalSetId));

                for (const goal of cancelableGoals) {

                    gi.progressLog.write(
                        `Canceling goal '${goal.name} (${goal.uniqueName})' in state '${goal.state
                        }' of goal set '${goal.goalSet} - ${goal.goalSetId}'`);

                    const updatedGoal = _.cloneDeep(goal);
                    updatedGoal.ts = Date.now();
                    updatedGoal.version = updatedGoal.version + 1;
                    updatedGoal.state = SdmGoalState.canceled;
                    updatedGoal.description = `Canceled ${goal.name}`;

                    const actx = gi.context as any as AutomationContextAware;
                    const prov: SdmGoalByShaAndBranch.Provenance = {
                        name,
                        registration: actx.context.name,
                        version: actx.context.version,
                        correlationId: actx.context.correlationId,
                        ts: Date.now(),
                    };
                    updatedGoal.provenance.push(prov);

                    await storeGoal(gi.context, updatedGoal as any);
                }

                return {
                    code: 0,
                    description: `Canceled goals ${canceledGoalSets.map(gs => codeLine(gs.slice(0, 7))).join(", ")}`,
                };
            }
        }
        return undefined;
    };
}

function provenanceFilter(sdmGoal: SdmGoalByShaAndBranch.SdmGoal,
                          registration: string): boolean {
    const provenances = [...sdmGoal.provenance].sort((p1, p2) => p1.ts - p2.ts);
    return provenances[0].registration === registration || registration.startsWith(`${provenances[0].registration}-job`);
}
