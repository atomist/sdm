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
import {
    ProjectOperationCredentials,
    TokenCredentials,
} from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { OnPush } from "../../../typings/types";
import { addressChannelsFor } from "../../commands/editors/toclient/addressChannels";
import { createStatus } from "../../commands/editors/toclient/ghub";
import { JvmService } from "../classification";
import { DefaultStatuses } from "./Statuses";

export type Classification = string;

export type Classifier = (p: GitProject) => Promise<Classification>;

/**
 * Scan code on a push to master. Result is setting GitHub status with context = "scan"
 */
@EventHandler("Scan code on master",
    GraphQL.subscriptionFromFile("../../../../../graphql/subscription/OnPush.graphql",
        __dirname, {
            branch: "master",
        }))
export class SetupStepsOnPush implements HandleEvent<OnPush.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    constructor(private classifier: Classifier) {}

    public handle(event: EventFired<OnPush.Subscription>, ctx: HandlerContext, params: this): Promise<HandlerResult> {
        const push: OnPush.Push = event.data.Push[0];
        const commit = push.commits[0];

        const msg = `Classification after push: \`${commit.sha}\` - _${commit.message}_`;
        console.log(msg);

        const id = new GitHubRepoRef(push.repo.owner, push.repo.name, commit.sha);

        const creds = {token: params.githubToken};

        const addressChannels = addressChannelsFor(push.repo, ctx);

        return GitCommandGitProject.cloned(creds, id)
            .then(p => params.classifier(p))
            .then(classification => {
                if (classification === JvmService) {
                    return DefaultStatuses.setAllToPending(id, creds);
                } else {
                    return Promise.resolve();
                }
            }).then(() => Success);
    }
}

export const ClassificationBase = "https://classification.atomist.com";

function setClassifyStatus(id: GitHubRepoRef, context: string, creds: ProjectOperationCredentials): Promise<any> {
    return createStatus((creds as TokenCredentials).token, id, {
        state: "success",
        target_url: `${id.apiBase}/${id.owner}/${id.repo}/${id.sha}`,
        context,
    });
}
