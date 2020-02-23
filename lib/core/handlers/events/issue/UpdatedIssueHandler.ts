/*
 * Copyright © 2020 Atomist, Inc.
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

import { Configuration } from "@atomist/automation-client/lib/configuration";
import {
    EventHandler,
    Value,
} from "@atomist/automation-client/lib/decorators";
import { subscription } from "@atomist/automation-client/lib/graph/graphQL";
import {
    EventFired,
    HandleEvent,
} from "@atomist/automation-client/lib/HandleEvent";
import { HandlerContext } from "@atomist/automation-client/lib/HandlerContext";
import {
    HandlerResult,
    Success,
} from "@atomist/automation-client/lib/HandlerResult";
import { logger } from "@atomist/automation-client/lib/util/logger";
import { resolveCredentialsPromise } from "../../../../api-helper/machine/handlerRegistrations";
import { addressChannelsFor } from "../../../../api/context/addressChannels";
import { PreferenceStoreFactory } from "../../../../api/context/preferenceStore";
import { createSkillContext } from "../../../../api/context/skillContext";
import {
    UpdatedIssueListener,
    UpdatedIssueListenerInvocation,
} from "../../../../api/listener/UpdatedIssueListener";
import { CredentialsResolver } from "../../../../spi/credentials/CredentialsResolver";
import { RepoRefResolver } from "../../../../spi/repo-ref/RepoRefResolver";
import * as schema from "../../../../typings/types";

/**
 * An issue has been updated
 */
@EventHandler("On issue update", subscription("OnIssueAction"))
export class UpdatedIssueHandler implements HandleEvent<schema.OnIssueAction.Subscription> {

    @Value("")
    public configuration: Configuration;

    private readonly updatedIssueListeners: UpdatedIssueListener[];

    constructor(updatedIssueListeners: UpdatedIssueListener[],
                private readonly repoRefResolver: RepoRefResolver,
                private readonly credentialsFactory: CredentialsResolver,
                private readonly preferenceStoreFactory: PreferenceStoreFactory) {
        this.updatedIssueListeners = updatedIssueListeners;
    }

    public async handle(event: EventFired<schema.OnIssueAction.Subscription>,
                        context: HandlerContext): Promise<HandlerResult> {
        const issue = event.data.Issue[0];
        const addressChannels = addressChannelsFor(issue.repo, context);
        const id = this.repoRefResolver.toRemoteRepoRef(issue.repo, {});
        const credentials = await resolveCredentialsPromise(this.credentialsFactory.eventHandlerCredentials(context, id));
        const preferences = this.preferenceStoreFactory(context);

        if (issue.updatedAt === issue.createdAt) {
            logger.debug("Issue created, not updated: %s on %j", issue.number, id);
            return Success;
        }

        const inv: UpdatedIssueListenerInvocation = {
            id,
            addressChannels,
            preferences,
            configuration: this.configuration,
            context,
            issue,
            credentials,
            skill: createSkillContext(context),
        };
        await Promise.all(this.updatedIssueListeners
            .map(l => l(inv)));
        return Success;
    }
}
