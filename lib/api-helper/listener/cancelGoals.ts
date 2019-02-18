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
export async function cancellableGoal(sdmGoal: SdmGoalEvent,
                                      configuration: Configuration): Promise<boolean> {
    const cancelableGoals = _.get(configuration, "sdm.goal.uncancellable") || [];
    return cancelableGoals.includes(sdmGoal.uniqueName);
}
