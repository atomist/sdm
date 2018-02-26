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

import { GraphQL, HandlerResult, logger, Secret, Secrets, success, Success } from "@atomist/automation-client";
import { EventFired, EventHandler, HandleEvent, HandlerContext } from "@atomist/automation-client/Handlers";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { OnSuccessStatus, StatusState } from "../../../../typings/types";
import { addressChannelsFor } from "../../../commands/editors/toclient/addressChannels";
import { createStatus } from "../../../commands/editors/toclient/ghub";
import { ListenerInvocation, SdmListener } from "../Listener";
import { currentPhaseIsStillPending, GitHubStatusAndFriends, previousPhaseSucceeded } from "../Phases";
import {
    ContextToPlannedPhase,
    HttpServicePhases,
    StagingEndpointContext,
    StagingVerifiedContext,
} from "../phases/httpServicePhases";

export interface EndpointVerificationInvocation extends ListenerInvocation {

    /**
     * Reported endpoint base url
     */
    url: string;
}

export type EndpointVerificationListener = SdmListener<EndpointVerificationInvocation>;

/**
 * React to an endpoint reported in a GitHub status.
 */
@EventHandler("React to an endpoint",
    GraphQL.subscriptionFromFile("graphql/subscription/OnSuccessStatus.graphql", undefined,
        {
            context: StagingEndpointContext,
        }))
export class OnEndpointStatus implements HandleEvent<OnSuccessStatus.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    private verifiers: EndpointVerificationListener[];

    constructor(...verifiers: EndpointVerificationListener[]) {
        this.verifiers = verifiers;
    }

    public handle(event: EventFired<OnSuccessStatus.Subscription>, context: HandlerContext, params: this): Promise<HandlerResult> {
        const status = event.data.Status[0];
        const commit = status.commit;

        const statusAndFriends: GitHubStatusAndFriends = {
            context: status.context,
            description: status.description,
            state: status.state,
            targetUrl: status.targetUrl,
            siblings: status.commit.statuses,
        };

        if (!previousPhaseSucceeded(HttpServicePhases, StagingVerifiedContext, statusAndFriends)) {
            return Promise.resolve(Success);
        }

        if (!currentPhaseIsStillPending(StagingVerifiedContext, statusAndFriends)) {
            return Promise.resolve(Success);
        }

        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);

        const addressChannels = addressChannelsFor(commit.repo, context);
        const i: EndpointVerificationInvocation = {
            id,
            url: status.targetUrl,
            addressChannels,
            context,
            credentials: { token: params.githubToken},
        };

        return Promise.all(params.verifiers.map(verifier => verifier(i)))
            .then(() => setVerificationStatus(params.githubToken, id, "success", status.targetUrl)
                .then(success))
            .catch(err => {
                // todo: report error in Slack? ... or load it to a log that links
                logger.warn("Failing verification because: " + err);
                return setVerificationStatus(params.githubToken, id,
                    "failure", status.targetUrl)
                    .then(success);
            });
    }
}

function setVerificationStatus(token: string, id: GitHubRepoRef, state: StatusState, targetUrl: string): Promise<any> {
    return createStatus(token, id, {
        state,
        target_url: targetUrl,
        context: StagingVerifiedContext,
        description: `${state === "success" ? "Completed" : "Failed to "} ${ContextToPlannedPhase[StagingVerifiedContext].name}`,
    });
}
