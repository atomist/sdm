/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
