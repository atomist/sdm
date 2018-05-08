/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {GitHubRepoRef} from "@atomist/automation-client/operations/common/GitHubRepoRef";
import {createStatus} from "../../../util/github/ghub";
import {GoalsSetListener, GoalsSetListenerInvocation} from "../../..";
import {CredentialsResolver} from "../../../handlers/common/CredentialsResolver";

export function CreatePendingGitHubStatusOnGoalSet(credentialsFactory: CredentialsResolver): GoalsSetListener {
    return async (inv: GoalsSetListenerInvocation) => {
        const { context, id} = inv;
        const credentials = credentialsFactory.eventHandlerCredentials(context, id);
        return createStatus(credentials, id as GitHubRepoRef, {
            context: "atomist/sdm/" + inv.goalSetId,
            description: "Atomist SDM Goals in progress",
            target_url: "https://app.atomist.com", // TODO: deep link!
            state: "pending",
        });
    };
}