/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { EventFired, EventHandler, HandleEvent, HandlerContext, HandlerResult, logger, Success } from "@atomist/automation-client";
import { subscription } from "@atomist/automation-client/graph/graphQL";
import { addressChannelsFor } from "../../../../api/context/addressChannels";
import Status = OnSuccessStatus.Status;
import { VerifiedDeploymentListener, VerifiedDeploymentListenerInvocation } from "../../../../api/listener/VerifiedDeploymentListener";
import { StagingVerifiedGoal } from "../../../../api/machine/wellKnownGoals";
import { CredentialsResolver } from "../../../../spi/credentials/CredentialsResolver";
import { RepoRefResolver } from "../../../../spi/repo-ref/RepoRefResolver";
import { OnSuccessStatus } from "../../../../typings/types";

/**
 * React to a verified deployment
 */
@EventHandler("Act on verified deployment",
    subscription({
        name: "OnSuccessStatus",
        variables: {
            context: StagingVerifiedGoal.context,
        },
    }),
)
export class OnVerifiedDeploymentStatus implements HandleEvent<OnSuccessStatus.Subscription> {

    constructor(private readonly listeners: VerifiedDeploymentListener[],
                private readonly repoRefResolver: RepoRefResolver,
                private readonly credentialsFactory: CredentialsResolver) {}

    public async handle(event: EventFired<OnSuccessStatus.Subscription>,
                        context: HandlerContext,
                        params: this): Promise<HandlerResult> {
        const status: Status = event.data.Status[0];
        const commit = status.commit;

        if (status.context !== StagingVerifiedGoal.context) {
            logger.debug(`********* onVerifiedStatus got called with status context=[${status.context}]`);
            return Success;
        }

        const id = this.repoRefResolver.toRemoteRepoRef(commit.repo, { sha: commit.sha });
        const credentials = this.credentialsFactory.eventHandlerCredentials(context, id);
        const vdi: VerifiedDeploymentListenerInvocation = {
            id,
            context,
            status,
            addressChannels: addressChannelsFor(commit.repo, context),
            credentials,
        };
        await Promise.all(params.listeners.map(l => l(vdi)));
        return Success;
    }
}
