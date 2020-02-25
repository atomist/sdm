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
import { GitCommandGitProject } from "@atomist/automation-client/lib/project/git/GitCommandGitProject";
import { resolveCredentialsPromise } from "../../../../api-helper/machine/handlerRegistrations";
import {
    AddressChannels,
    addressChannelsFor,
} from "../../../../api/context/addressChannels";
import { PreferenceStoreFactory } from "../../../../api/context/preferenceStore";
import { createSkillContext } from "../../../../api/context/skillContext";
import {
    ProjectListener,
    ProjectListenerInvocation,
} from "../../../../api/listener/ProjectListener";
import { CredentialsResolver } from "../../../../spi/credentials/CredentialsResolver";
import { RepoRefResolver } from "../../../../spi/repo-ref/RepoRefResolver";
import * as schema from "../../../../typings/types";

/**
 * A repo has been onboarded
 */
@EventHandler("On repo onboarding", subscription("OnRepoOnboarded"))
export class OnRepoOnboarded implements HandleEvent<schema.OnRepoOnboarded.Subscription> {

    @Value("")
    public configuration: Configuration;

    constructor(private readonly actions: ProjectListener[],
                private readonly repoRefResolver: RepoRefResolver,
                private readonly credentialsFactory: CredentialsResolver,
                private readonly preferenceStoreFactory: PreferenceStoreFactory) {
    }

    public async handle(event: EventFired<schema.OnRepoOnboarded.Subscription>,
                        context: HandlerContext): Promise<HandlerResult> {
        const repoOnboarded = event.data.RepoOnboarded[0];
        const id = this.repoRefResolver.toRemoteRepoRef(repoOnboarded.repo, {branch: repoOnboarded.repo.defaultBranch});
        const credentials = await resolveCredentialsPromise(this.credentialsFactory.eventHandlerCredentials(context, id));
        const addressChannels: AddressChannels = addressChannelsFor(repoOnboarded.repo, context);
        const preferences = this.preferenceStoreFactory(context);

        const project = await GitCommandGitProject.cloned(credentials, id);
        const invocation: ProjectListenerInvocation = {
            id,
            context,
            addressChannels,
            preferences,
            configuration: this.configuration,
            credentials,
            project,
            skill: createSkillContext(context),
        };
        await Promise.all(this.actions
            .map(l => l(invocation)),
        );
        return Success;
    }
}
