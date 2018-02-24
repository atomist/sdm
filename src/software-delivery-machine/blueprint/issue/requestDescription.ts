import { HandlerResult, Success } from "@atomist/automation-client";

export async function requestDescription(issue, id, ac, ctx): Promise<HandlerResult> {
    if (!issue.body || issue.body.length < 10) {
        await ctx.messageClient.addressUsers(
            `Please add a description for new issue ${issue.number}: _${issue.title}_: ${id.url}/issues/${issue.number}`,
            issue.openedBy.person.chatId.screenName);
    }
    return Success;
}
