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
    Configuration,
    HandlerContext,
    QueryNoCacheOptions,
} from "@atomist/automation-client";
import * as _ from "lodash";
import { SdmGoalEvent } from "../../api/goal/SdmGoalEvent";
import { CanceledSdmGoal } from "../../typings/types";

/**
 * Check if current goal is already canceled
 */
export async function isGoalCanceled(sdmGoal: SdmGoalEvent,
                                     ctx: HandlerContext): Promise<boolean> {

    // Validate that goal hasn't been canceled in the meantime
    const goalCanceled = await ctx.graphClient.query<CanceledSdmGoal.Query, CanceledSdmGoal.Variables>({
        name: "CanceledSdmGoal",
        variables: {
            goalSetId: sdmGoal.goalSetId,
            uniqueName: sdmGoal.uniqueName,
        },
        options: QueryNoCacheOptions,
    });

    return goalCanceled && goalCanceled.SdmGoal && goalCanceled.SdmGoal.length > 0;
}

/**
 * Can goal be canceled
 */
export async function cancelableGoal(sdmGoal: SdmGoalEvent,
                                     configuration: Configuration): Promise<boolean> {
    const cancelableGoals = _.get(configuration, "sdm.goal.uncancelable") || [];
    return cancelableGoals.includes(sdmGoal.uniqueName) || cancelableGoals.includes(sdmGoal.name);
}
