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
import { EventFired, EventHandler, HandleEvent, HandlerContext } from "@atomist/automation-client/Handlers";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { OnFailureStatus, OnSuccessStatus } from "../../../typings/types";
import { Phases } from "./Phases";
import Status = OnSuccessStatus.Status;

/**
 * Respond to a failure status by failing downstream phases
 */
@EventHandler("Fail downstream phases on a phase failure",
    GraphQL.subscriptionFromFile("../../../../../graphql/subscription/OnFailureStatus.graphql",
        __dirname))
export class FailDownstreamPhasesOnPhaseFailure implements HandleEvent<OnFailureStatus.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    constructor(private phases: Phases) {
    }

    public handle(event: EventFired<OnFailureStatus.Subscription>, ctx: HandlerContext, params: this): Promise<HandlerResult> {
        const status: Status = event.data.Status[0];
        const commit = status.commit;

        if (status.state !== "failure") {
            console.log(`********* failure reported when the state was=[${status.state}]`);
            return Promise.resolve(Success);
        }

        const currentlyPending = status.commit.statuses.filter(s => s.state === "pending");

        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);

        return params.phases.gameOver(status.context,
            currentlyPending.map(s => s.context),
            id, {token: params.githubToken});
    }
}
