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

import { QueryNoCacheOptions } from "@atomist/automation-client";
import {
    DefaultQueueOptions,
    QueueOptions,
} from "../../api/goal/common/Queue";
import { GoalInvocation } from "../../api/goal/GoalInvocation";
import {
    InProcessSdmGoalSets,
    SdmGoalState,
} from "../../typings/types";
import { updateGoal } from "../goal/storeGoals";

export function conditionQueueGoalSet(options: QueueOptions): (gi: GoalInvocation) => Promise<boolean> {
    return async gi => {

        const { sdmGoal, context } = gi;

        const registration = gi.configuration.name;
        const optsToUse: QueueOptions = {
            ...DefaultQueueOptions,
            ...options,
        };

        const goalSets = await context.graphClient.query<InProcessSdmGoalSets.Query, InProcessSdmGoalSets.Variables>({
            name: "InProcessSdmGoalSets",
            variables: {
                fetch: optsToUse.fetch,
                registration: [registration],
            },
            options: QueryNoCacheOptions,
        });

        if (goalSets && goalSets.SdmGoalSet && goalSets.SdmGoalSet) {
            const index = goalSets.SdmGoalSet.findIndex(gs => gs.goalSetId === sdmGoal.goalSetId);
            if (index >= 0 && index < optsToUse.concurrent) {
                return true;
            } else if (index > 0) {
                await updateGoal(gi.context, sdmGoal, {
                    state: SdmGoalState.in_process,
                    description: `Queued`,
                    phase: `at ${index + 1 - optsToUse.concurrent}`,
                });
            }
        }

        return true;
    };
}
