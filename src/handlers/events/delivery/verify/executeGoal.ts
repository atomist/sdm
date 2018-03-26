import { ExecuteGoalInvocation, ExecuteGoalResult, GoalExecutor } from "../../../../common/delivery/goals/goalExecution";
import { updateGoal } from "../../../../common/delivery/goals/storeGoals";
import { failure, HandlerContext, logger, Success } from "@atomist/automation-client";
import { StatusForExecuteGoal } from "../../../../typings/types";
import { SdmGoal } from "../../../../ingesters/sdmGoalIngester";
import { Goal } from "../../../../common/delivery/goals/Goal";
import { repoRefFromStatus } from "../../../../util/git/repoRef";

export async function executeGoal(execute: GoalExecutor,
                                  status: StatusForExecuteGoal.Fragment,
                                  ctx: HandlerContext,
                                  params: ExecuteGoalInvocation,
                                  sdmGoal: SdmGoal): Promise<ExecuteGoalResult> {
    logger.info(`Running ${params.goal.name}. Triggered by ${status.state} status: ${status.context}: ${status.description}`);
    await markGoalInProcess(ctx, sdmGoal, params.goal);
    try {
        const result = await execute(status, ctx, params);
        await markStatus(ctx, sdmGoal, params.goal, result);
        return Success;
    } catch (err) {
        logger.warn("Error executing %s on %s: %s", params.implementationName, repoRefFromStatus(status).url, err.message);
        await markStatus(ctx, sdmGoal, params.goal, {code: 1});
        return failure(err);
    }
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

function markGoalInProcess(ctx: HandlerContext, sdmGoal: SdmGoal, goal: Goal) {
    return updateGoal(ctx, sdmGoal, {
        goal,
        description: goal.inProcessDescription,
        state: "in_process",
    }).catch(err =>
        logger.warn("Failed to update %s goal to tell people we are working on it", goal.name));

}