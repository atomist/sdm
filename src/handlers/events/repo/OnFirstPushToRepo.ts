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

import { GraphQL, Secret, Secrets, success } from "@atomist/automation-client";
import {
    EventFired,
    EventHandler,
    HandleEvent,
    HandlerContext,
    HandlerResult,
    Success,
} from "@atomist/automation-client/Handlers";

import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import * as schema from "../../../typings/types";
import { AddressChannels } from "../../commands/editors/toclient/addressChannels";

import * as _ from "lodash";

export type NewRepoWithCodeAction = (id: GitHubRepoRef, creds: ProjectOperationCredentials,
                                     addressChannels: AddressChannels,
                                     ctx: HandlerContext) => Promise<any>;

/**
 * A new repo has been created, and it has some code in it.
 */
@EventHandler("On repo creation",
    GraphQL.subscriptionFromFile("graphql/subscription/OnFirstPushToRepo.graphql"))
export class OnFirstPushToRepo
    implements HandleEvent<schema.OnFirstPushToRepo.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    constructor(private action: NewRepoWithCodeAction) {
    }

    public handle(event: EventFired<schema.OnFirstPushToRepo.Subscription>, ctx: HandlerContext, params: this): Promise<HandlerResult> {
        const push = event.data.Push[0];

        if (!!push.before) {
            console.log(`Get out here: Not a new commit on ${push.repo.name}`);
            return Promise.resolve(Success);
        }

        if (push.branch !== push.repo.defaultBranch) {
            console.log(`Get out here: Not push to the default branch on ${push.repo.name}`);
            return Promise.resolve(Success);
        }

        const screenName = _.get<string>(push, "after.committer.person.chatId.screenName");

        if (!screenName) {
            return Promise.resolve(success());
        }

        const addressChannels: AddressChannels = m => ctx.messageClient.addressUsers(m, screenName);

        const id = new GitHubRepoRef(push.repo.owner, push.repo.name, push.after.sha);
        return params.action(id, {token: params.githubToken}, addressChannels, ctx)
            .then(() => Promise.resolve(Success));
    }
}
