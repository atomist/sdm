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

import {
    EventFired,
    EventHandler,
    failure,
    GraphQL,
    HandleEvent,
    HandlerContext,
    HandlerResult,
    logger,
    Secret,
    Secrets,
    Success,
} from "@atomist/automation-client";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import {
    ProjectOperationCredentials,
    TokenCredentials,
} from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { executeAutofixes } from "../../../../common/delivery/code/autofix/executeAutofixes";
import { AutofixRegistration } from "../../../../common/delivery/code/codeActionRegistrations";
import { Goal } from "../../../../common/delivery/goals/Goal";
import { OnAnyPendingStatus, StatusState } from "../../../../typings/types";
import { createStatus } from "../../../../util/github/ghub";

/**
 * Run any autofix editors on a push.
 * Set GitHub success status
 */
@EventHandler("Make autofixes", GraphQL.subscriptionFromFile(
    "../../../../graphql/subscription/OnAnyPendingStatus",
    __dirname),
)
export class OnPendingAutofixStatus implements HandleEvent<OnAnyPendingStatus.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    private registrations: AutofixRegistration[];

    constructor(public goal: Goal,
                registrations: AutofixRegistration[] = []) {
        this.registrations = registrations;
    }

    public async handle(event: EventFired<OnAnyPendingStatus.Subscription>,
                        context: HandlerContext,
                        params: this): Promise<HandlerResult> {
        const status = event.data.Status[0];
        const commit = status.commit;

        const repoRefWithSha = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);
        const credentials = {token: params.githubToken};

        if (status.context !== params.goal.context || status.state !== "pending") {
            logger.warn(`I was looking for ${params.goal.context} being pending, but I heard about ${status.context} being ${status.state}`);
            return Success;
        }

        try {
            await executeAutofixes(commit, context, credentials, params.registrations);
            await markStatus(repoRefWithSha, params.goal, StatusState.success, credentials);
            return Success;
        } catch (err) {
            logger.info("Error executing autofixes on %s", repoRefWithSha.url, err);
            await markStatus(repoRefWithSha, params.goal, StatusState.error, credentials);
            return failure(err);
        }
    }
}

function markStatus(id: GitHubRepoRef, goal: Goal, state: StatusState,
                    creds: ProjectOperationCredentials): Promise<any> {
    return createStatus((creds as TokenCredentials).token, id, {
        state,
        context: goal.context,
        description: goal.completedDescription,
    });
}
