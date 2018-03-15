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
