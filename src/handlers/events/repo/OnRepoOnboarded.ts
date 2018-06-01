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

import { EventFired, EventHandler, HandleEvent, HandlerContext, HandlerResult, Success } from "@atomist/automation-client";
import { subscription } from "@atomist/automation-client/graph/graphQL";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { AddressChannels, addressChannelsFor } from "../../../api/context/addressChannels";
import { ProjectListener, ProjectListenerInvocation } from "../../../api/listener/ProjectListener";
import { CredentialsResolver } from "../../../spi/credentials/CredentialsResolver";
import { RepoRefResolver } from "../../../spi/repo-ref/RepoRefResolver";
import * as schema from "../../../typings/types";

/**
 * A repo has been onboarded
 */
@EventHandler("On repo onboarding", subscription("OnRepoOnboarded"))
export class OnRepoOnboarded implements HandleEvent<schema.OnRepoOnboarded.Subscription> {

    constructor(private readonly actions: ProjectListener[],
                private readonly repoRefResolver: RepoRefResolver,
                private readonly credentialsFactory: CredentialsResolver) {
    }

    public async handle(event: EventFired<schema.OnRepoOnboarded.Subscription>,
                        context: HandlerContext,
                        params: this): Promise<HandlerResult> {
        const repoOnboarded = event.data.RepoOnboarded[0];
        const id = params.repoRefResolver.toRemoteRepoRef(repoOnboarded.repo, {branch: repoOnboarded.repo.defaultBranch});
        const credentials = this.credentialsFactory.eventHandlerCredentials(context, id);

        const addressChannels: AddressChannels = addressChannelsFor(repoOnboarded.repo, context);
        const project = await GitCommandGitProject.cloned(credentials, id);
        const invocation: ProjectListenerInvocation = {
            id,
            context,
            addressChannels,
            credentials,
            project,
        };
        await Promise.all(params.actions
            .map(l => l(invocation)),
        );
        return Success;
    }
}
