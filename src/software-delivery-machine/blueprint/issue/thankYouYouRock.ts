import { ClosedIssueInvocation } from "../../../common/listener/ClosedIssueListener";

export async function thankYouYouRock(inv: ClosedIssueInvocation) {
    await inv.context.messageClient.addressUsers(
        ":thumbsup: Thank you. You Rock! :guitar:\n" +
        `You closed issue ${inv.issue.number}: _${inv.issue.title}_: ${inv.id.url}/issues/${inv.issue.number}`,
        inv.issue.openedBy.person.chatId.screenName,
    );
}
