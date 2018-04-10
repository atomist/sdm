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

import { CodeActionRegistration } from "../../../common/delivery/code/CodeActionRegistration";
import { CodeReactionInvocation } from "../../../common/listener/CodeReactionListener";

/**
 * React to a push by listing changed files to any Slack channels
 * associated with the repo
 * @param {CodeReactionInvocation} i
 * @return {Promise<any>}
 */
export const listChangedFiles: CodeActionRegistration = {
    action(i: CodeReactionInvocation) {
        return i.addressChannels(`Files changed:\n${i.filesChanged.map(n => "- `" + n + "`").join("\n")}`);
    },
    name: "List files changed",
};
