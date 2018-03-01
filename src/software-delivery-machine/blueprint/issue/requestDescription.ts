import { NewIssueInvocation } from "../../../common/listener/NewIssueListener";

export async function requestDescription(inv: NewIssueInvocation) {
    if (!inv.issue.body || inv.issue.body.length < 10) {
        await inv.context.messageClient.addressUsers(
            `Please add a description for new issue ${inv.issue.number}: _${inv.issue.title}_: ${inv.id.url}/issues/${inv.issue.number}`,
            inv.issue.openedBy.person.chatId.screenName);
    }
}
