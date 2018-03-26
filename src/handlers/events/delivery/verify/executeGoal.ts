import { ExecuteGoalInvocation, ExecuteGoalResult, GoalExecutor } from "../../../../common/delivery/goals/goalExecution";
import { updateGoal } from "../../../../common/delivery/goals/storeGoals";
import { HandlerContext, logger } from "@atomist/automation-client";
import { StatusForExecuteGoal } from "../../../../typings/types";
import { SdmGoal } from "../../../../ingesters/sdmGoalIngester";
import { Goal } from "../../../../common/delivery/goals/Goal";

export async function executeGoal(execute: GoalExecutor,
                                  status: StatusForExecuteGoal.Fragment,
                                  ctx: HandlerContext,
                                  params: ExecuteGoalInvocation,
                                  thisSdmGoal: SdmGoal): Promise<ExecuteGoalResult> {

    logger.info(`Running ${params.goal.name}. Triggered by ${status.state} status: ${status.context}: ${status.description}`);
    await updateGoal(ctx, thisSdmGoal, {
        goal: params.goal,
        description: params.goal.inProcessDescription,
        state: "in_process",
    }).catch(err =>
        logger.warn("Failed to update %s goal to tell people we are working on it", params.goal.name));
    return execute(status, ctx, params);
}

export function validSubscriptionName(input: string): string {
    return input.replace(/[-\s]/, "_")
        .replace(/^(\d)/, "number$1");
}

export function markStatus(ctx: HandlerContext, sdmGoal: SdmGoal, goal: Goal, result: ExecuteGoalResult) {
    const newState = result.code !== 0 ? "failure" :
        result.requireApproval ? "waiting_for_approval" : "success";
    return updateGoal(ctx, sdmGoal as SdmGoal,
        {
            goal,
            url: result.targetUrl,
            state: newState,
        });
}