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
import { Destination } from "@atomist/automation-client/spi/message/MessageClient";
import { OnSuccessStatus, StatusState } from "../../../../typings/types";
import { addressChannelsFor, messageDestinations } from "../../../commands/editors/toclient/addressChannels";
import { StagingVerifiedContext } from "../phases/httpServicePhases";
import Status = OnSuccessStatus.Status;
import { ListenerInvocation, SdmListener } from "../Listener";

// something independent of the particular query
export interface StatusInfo {
    state?: StatusState | null;
    targetUrl?: string | null;
    context?: string | null;
}

export interface VerifiedDeploymentInvocation extends ListenerInvocation {
    status: StatusInfo;
    messageDestination: Destination;
}

/**
 * React to a verified deployment
 */
@EventHandler("Act on verified project",
    GraphQL.subscriptionFromFile("graphql/subscription/OnSuccessStatus.graphql",
        undefined, {
            context: StagingVerifiedContext,
        }))
export class OnVerifiedStatus implements HandleEvent<OnSuccessStatus.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    constructor(private listeners: Array<SdmListener<VerifiedDeploymentInvocation>>) {
    }

    public async handle(event: EventFired<OnSuccessStatus.Subscription>,
                        context: HandlerContext, params: this): Promise<HandlerResult> {
        const status: Status = event.data.Status[0];
        const commit = status.commit;

        if (status.context !== StagingVerifiedContext) {
            console.log(`********* onVerifiedStatus got called with status context=[${status.context}]`);
            return Promise.resolve(Success);
        }

        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);
        const i: VerifiedDeploymentInvocation = {
            id,
            context,
            status,
            addressChannels: addressChannelsFor(commit.repo, context),
            messageDestination: messageDestinations(commit.repo, context),
            credentials: {token: params.githubToken},
        };

        await Promise.all(params.listeners.map(l => l(i)));
        return Success;
    }
}
