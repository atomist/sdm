import { NewIssueInvocation } from "../../../common/listener/NewIssueListener";

/**
 * Fun issue automations: Not for real use
 */

export async function stopRaisingIssues(inv: NewIssueInvocation) {
    await inv.context.messageClient.addressUsers(
        `${inv.issue.openedBy.person.name}, *please* stop raising issues!! :crying_cat_face:`,
        inv.issue.openedBy.person.chatId.screenName);
}

export async function ohTheHorror(inv: NewIssueInvocation) {
    return inv.addressChannels("Oh no, not another issue :thumbsdown:");
}
