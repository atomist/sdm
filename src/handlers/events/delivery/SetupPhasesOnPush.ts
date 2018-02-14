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
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { OnPush } from "../../../typings/types";
import { Phases } from "./Phases";

export type Classifier = (p: GitProject) => Promise<Phases>;

/**
 * Scan code on a push to master. Result is setting GitHub status with context = "scan"
 */
@EventHandler("Scan code on master",
    GraphQL.subscriptionFromFile("../../../../../graphql/subscription/OnPush.graphql",
        __dirname, {
            branch: "master",
        }))
export class SetupPhasesOnPush implements HandleEvent<OnPush.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    constructor(private classifier: Classifier) {}

    public handle(event: EventFired<OnPush.Subscription>, ctx: HandlerContext, params: this): Promise<HandlerResult> {
        const push: OnPush.Push = event.data.Push[0];
        const commit = push.commits[0];

        const id = new GitHubRepoRef(push.repo.owner, push.repo.name, commit.sha);

        const creds = {token: params.githubToken};

        return GitCommandGitProject.cloned(creds, id)
            .then(p => params.classifier(p))
            .then(phases => {
                if (!!phases) {
                    return phases.setAllToPending(id, creds);
                } else {
                    return Promise.resolve();
                }
            }).then(() => Success);
    }
}
