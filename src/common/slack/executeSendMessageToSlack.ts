
import { Success } from "@atomist/automation-client";
import { SlackMessage } from "@atomist/slack-messages";
import { ExecuteGoalWithLog, RunWithLogContext } from "../delivery/deploy/runWithLog";
import { ExecuteGoalResult } from "../delivery/goals/goalExecution";

/***
 * Execute a goal by sending a message to the linked Slack channels
 * @param {string | SlackMessage} msg
 * @return {ExecuteGoalWithLog}
 */
export function executeSendMessageToSlack(msg: string | SlackMessage): ExecuteGoalWithLog {
    return async (rwlc: RunWithLogContext): Promise<ExecuteGoalResult> => {
        await rwlc.addressChannels(msg);
        return Success;
    };
}
