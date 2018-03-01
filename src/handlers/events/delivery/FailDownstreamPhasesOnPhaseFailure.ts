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

import {GraphQL, HandlerResult, logger, Secret, Secrets, Success} from "@atomist/automation-client";
import {EventFired, EventHandler, HandleEvent, HandlerContext} from "@atomist/automation-client/Handlers";
import {GitHubRepoRef} from "@atomist/automation-client/operations/common/GitHubRepoRef";
import {ProjectOperationCredentials, TokenCredentials} from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import Status = OnSuccessStatus.Status;
import {BaseContext, contextIsAfter, GitHubStatusContext, splitContext} from "../../../common/phases/gitHubContext";
import {Phases, PlannedPhase} from "../../../common/phases/Phases";
import {OnFailureStatus, OnSuccessStatus} from "../../../typings/types";
import {createStatus, State} from "../../../util/github/ghub";
import {contextToPlannedPhase, ContextToPlannedPhase} from "./phases/httpServicePhases";

/**
 * Respond to a failure status by failing downstream phases
 */
@EventHandler("Fail downstream phases on a phase failure",
    GraphQL.subscriptionFromFile("graphql/subscription/OnFailureStatus.graphql"))
export class FailDownstreamPhasesOnPhaseFailure implements HandleEvent<OnFailureStatus.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    public handle(event: EventFired<OnFailureStatus.Subscription>, ctx: HandlerContext, params: this): Promise<HandlerResult> {
        const status: Status = event.data.Status[0];
        const commit = status.commit;

        if (status.state !== "failure") {
            logger.debug(`********* failure reported when the state was=[${status.state}]`);
            return Promise.resolve(Success);
        }

        if (status.description.startsWith("Skipping ")) {
            logger.debug("not relevant, because I set this status to failure in an earlier invocation of myself.");
            logger.debug(`context: ${status.context} description: ${status.description}`);
            return Promise.resolve(Success);
        }

        const currentlyPending = status.commit.statuses.filter(s => s.state === "pending");

        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);

        return gameOver(
            status.context,
            currentlyPending.map(s => s.context),
            id,
            {token: params.githubToken})
            .then(() => Success);
    }
}

/**
 * Set all downstream phase to failure status given a specific failed phase.
 *
 * The phases are associated by the atomist-sdm/${env}/ prefix in their context.
 *
 */
function gameOver(failedContext: GitHubStatusContext, currentlyPending: GitHubStatusContext[],
                  id: GitHubRepoRef, creds: ProjectOperationCredentials): Promise<any> {

    const interpretedContext = splitContext(failedContext);

    if (!interpretedContext) {
        // this is not our status
        logger.info("not relevant: " + failedContext);
        return Promise.resolve();
    }

    const failedPhase: PlannedPhase = contextToPlannedPhase(failedContext);

    const phasesToReset = currentlyPending
        .filter(pendingContext => contextIsAfter(failedContext, pendingContext))
        .map(p => contextToPlannedPhase(p));
    return Promise.all(phasesToReset.map(
        p => setStatus(id, p.context, "failure", creds,
            `Skipping ${p.name} because ${failedPhase.name} failed`)));
}

function setStatus(id: GitHubRepoRef, context: GitHubStatusContext,
                   state: State,
                   creds: ProjectOperationCredentials,
                   description: string = context): Promise<any> {
    logger.debug("Setting pending status " + context + " to failure");
    return createStatus((creds as TokenCredentials).token, id, {
        state,
        context,
        description,
    });
}
