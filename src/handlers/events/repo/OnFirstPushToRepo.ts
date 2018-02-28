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

import { GraphQL, logger, Secret, Secrets } from "@atomist/automation-client";
import {
    EventFired,
    EventHandler,
    HandleEvent,
    HandlerContext,
    HandlerResult,
    Success,
} from "@atomist/automation-client/Handlers";

import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { AddressChannels } from "../../../common/slack/addressChannels";
import * as schema from "../../../typings/types";

import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import * as _ from "lodash";
import { ProjectListener, ProjectListenerInvocation } from "../../../common/listener/Listener";

/**
 * A new repo has been created, and it has some code in it.
 */
@EventHandler("On repo creation",
    GraphQL.subscriptionFromFile("graphql/subscription/OnFirstPushToRepo.graphql"))
export class OnFirstPushToRepo
    implements HandleEvent<schema.OnFirstPushToRepo.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    constructor(private actions: ProjectListener[]) {
    }

    public async handle(event: EventFired<schema.OnFirstPushToRepo.Subscription>,
                        context: HandlerContext, params: this): Promise<HandlerResult> {
        const push = event.data.Push[0];

        if (!!push.before) {
            logger.info(`Done: Not a new commit on ${push.repo.name}`);
            return Success;
        }

        if (push.branch !== push.repo.defaultBranch) {
            logger.info(`Done: Not push to the default branch on ${push.repo.name}`);
            return Success;
        }

        const screenName = _.get<string>(push, "after.committer.person.chatId.screenName");

        const id = new GitHubRepoRef(push.repo.owner, push.repo.name, push.after.sha);
        const credentials = {token: params.githubToken};

        if (!screenName) {
            logger.warn("Warning: Cannot get screen name of committer for first push on %j", id);
            return Success;
        }

        const addressChannels: AddressChannels = m => context.messageClient.addressUsers(m, screenName);

        const project = await GitCommandGitProject.cloned(credentials, id);
        const invocation: ProjectListenerInvocation = {
            id,
            context,
            addressChannels,
            credentials,
            project,
        };
        await Promise.all(params.actions
            .map(l => l(invocation)),
        );
        return Success;
    }
}
