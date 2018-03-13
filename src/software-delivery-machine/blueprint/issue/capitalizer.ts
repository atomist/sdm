import { TokenCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { NewIssueInvocation } from "../../../common/listener/NewIssueListener";
import { updateIssue } from "../../../util/github/ghub";

/**
 * Capitalize the first letter of an issue
 * @param {NewIssueInvocation} inv
 * @return {Promise<void>}
 */
export async function capitalizer(inv: NewIssueInvocation) {
    const title = inv.issue.title;
    const firstChar = title.charAt(0);
    if (firstChar !== firstChar.toUpperCase()) {
        // We need to capitalize the issue
        await inv.context.messageClient.addressUsers(
            `Capitalizing the title of new new issue ${inv.issue.number}: _${inv.issue.title}_: ${inv.id.url}/issues/${inv.issue.number}`,
            inv.issue.openedBy.person.chatId.screenName);
        await updateIssue((inv.credentials as TokenCredentials).token,
            inv.id,
            inv.issue.number,
            {
                title: firstChar.toUpperCase() + title.substr(1),
                body: inv.issue.body,
            });
    }
}
