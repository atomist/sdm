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

import { GraphQL, HandlerResult, Secret, Secrets, Success } from "@atomist/automation-client";
import { EventFired, EventHandler, HandlerContext } from "@atomist/automation-client/Handlers";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { OnAnySuccessStatus } from "../../../../typings/types";
import { StatusSuccessHandler } from "../../StatusSuccessHandler";
import { currentPhaseIsStillPending, nothingFailed, Phases, previousPhaseSucceeded } from "../Phases";
import { Builder } from "./Builder";

/**
 * See a GitHub success status with context "scan" and trigger a build producing an artifact status
 */
@EventHandler("Build on source scan success",
    GraphQL.subscriptionFromFile("../../../../../../graphql/subscription/OnAnySuccessStatus.graphql",
        __dirname))
export class BuildOnScanSuccessStatus implements StatusSuccessHandler {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    constructor(public phases: Phases,
                public ourContext: string,
                private builder: Builder) {
    }

    public async handle(event: EventFired<OnAnySuccessStatus.Subscription>, ctx: HandlerContext, params: this): Promise<HandlerResult> {
        const status = event.data.Status[0];
        const commit = status.commit;
        const team = commit.repo.org.chatTeam.id;

        const statusAndFriends = {
            context: status.context,
            state: status.state,
            targetUrl: status.targetUrl,
            siblings: status.commit.statuses,
        };

        if (nothingFailed(statusAndFriends) && !previousPhaseSucceeded(params.phases, this.ourContext, statusAndFriends)) {
            return Promise.resolve(Success);
        }

        if (!currentPhaseIsStillPending(this.ourContext, statusAndFriends)) {
            return Promise.resolve(Success);
        }

        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);
        const creds = {token: params.githubToken};

        await params.builder.initiateBuild(creds, id, team);
        return Success;
    }
}
