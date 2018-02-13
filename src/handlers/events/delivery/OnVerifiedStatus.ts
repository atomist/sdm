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
import { OnSuccessStatus, StatusState } from "../../../typings/types";
import Status = OnSuccessStatus.Status;
import { AddressChannels, addressChannelsFor } from "../../commands/editors/toclient/addressChannels";
import { createStatus } from "../../commands/editors/toclient/ghub";
import { EndpointContext, ScanContext, VerifiedContext } from "./Phases";

export type VerifiedDeploymentListener = (id: GitHubRepoRef, s: Status,
                                          addressChannels: AddressChannels,
                                          ctx: HandlerContext) => Promise<any>;

/**
 * Deploy a published artifact identified in a GitHub "artifact" status.
 */
@EventHandler("Act on verified project",
    GraphQL.subscriptionFromFile("../../../../../graphql/subscription/OnSuccessStatus.graphql",
        __dirname, {
            context: VerifiedContext,
        }))
export class OnVerifiedStatus implements HandleEvent<OnSuccessStatus.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    constructor(private listener: VerifiedDeploymentListener) {
    }

    public handle(event: EventFired<OnSuccessStatus.Subscription>, ctx: HandlerContext, params: this): Promise<HandlerResult> {
        const status: Status = event.data.Status[0];
        const commit = status.commit;

        if (status.context !== VerifiedContext) {
            console.log(`********* onVerifiedStatus got called with status context=[${status.context}]`);
            return Promise.resolve(Success);
        }

        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);
        const addressChannels = addressChannelsFor(commit.repo, ctx);

        return params.listener(id, status, addressChannels, ctx)
            .then(() => Success);
    }
}
