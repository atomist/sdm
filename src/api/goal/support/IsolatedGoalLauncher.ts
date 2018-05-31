
import { HandlerContext, HandlerResult } from "@atomist/automation-client";
import { ProgressLog } from "../../../spi/log/ProgressLog";
import { OnAnyRequestedSdmGoal } from "../../../typings/types";

/**
 * Launch a goal in an isolated environment (container or process) for fulfillment.
 */
export type IsolatedGoalLauncher = (goal: OnAnyRequestedSdmGoal.SdmGoal,
                                    ctx: HandlerContext,
                                    progressLog: ProgressLog) => Promise<HandlerResult>;
