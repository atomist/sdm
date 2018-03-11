/*
 * Copyright © 2017 Atomist, Inc.
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

import { GraphQL, Secret, Secrets, Success } from "@atomist/automation-client";
import {
    EventFired,
    EventHandler,
    HandleEvent,
    HandlerContext,
    HandlerResult,
} from "@atomist/automation-client/Handlers";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { OnPushWithBefore } from "../../../../typings/types";
import { createStatus } from "../../../../util/github/ghub";
import { truncateCommitMessage } from "../../../../util/lifecycleHelpers";

export const SupersededContext = "superseded";

/**
 * Set superseded status on previous commit on a push
 */
@EventHandler("Scan code on master",
    GraphQL.subscriptionFromFile("graphql/subscription/OnPushWithBefore.graphql"))
export class SetSupersededStatus implements HandleEvent<OnPushWithBefore.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    public async handle(event: EventFired<OnPushWithBefore.Subscription>, ctx: HandlerContext, params: this): Promise<HandlerResult> {
        const push = event.data.Push[0];
        const id = new GitHubRepoRef(push.repo.owner, push.repo.name, push.before.sha);
        createStatus(params.githubToken, id, {
            context: SupersededContext,
            state: "error",
            description: `Superseded by \`${push.after.sha.substring(0, 5)}\`: _${truncateCommitMessage(push.after.message, push.repo)}_`,
            target_url: `${id.url}/tree/${id.sha}`,
        });

        return Success;
    }
}
