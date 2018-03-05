/*
 * Copyright © 201 Atomist, Inc.
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

import {
    GraphQL,
    logger,
    MappedParameter,
    MappedParameters,
    Parameter,
    Secret,
    Secrets,
    Success,
} from "@atomist/automation-client";
import { Parameters } from "@atomist/automation-client/decorators";
import {
    EventFired,
    EventHandler,
    HandleEvent,
    HandlerContext,
    HandlerResult,
} from "@atomist/automation-client/Handlers";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { PhaseCreationInvocation, PhaseCreator } from "../../../../common/listener/PhaseCreator";
import { Phases } from "../../../../common/phases/Phases";
import { addressChannelsFor } from "../../../../common/slack/addressChannels";
import { OnPushToAnyBranch } from "../../../../typings/types";
import { createStatus, tipOfDefaultBranch } from "../../../../util/github/ghub";
import { ImmaterialPhases } from "../phases/httpServicePhases";

/**
 * Set up phases on a push (e.g. for delivery).
 */
@EventHandler("Set up phases",
    GraphQL.subscriptionFromFile("graphql/subscription/OnPushToAnyBranch.graphql"))
export class SetupPhasesOnPush implements HandleEvent<OnPushToAnyBranch.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    private phaseCreators: PhaseCreator[];

    /**
     * Configure phase creation
     * @param phaseCreators first PhaseCreator that returns phases
     */
    constructor(...phaseCreators: PhaseCreator[]) {
        this.phaseCreators = phaseCreators;
    }

    public async handle(event: EventFired<OnPushToAnyBranch.Subscription>, context: HandlerContext, params: this): Promise<HandlerResult> {
        const push: OnPushToAnyBranch.Push = event.data.Push[0];
        const commit = push.commits[0];
        const id = new GitHubRepoRef(push.repo.owner, push.repo.name, commit.sha);
        const credentials = {token: params.githubToken};
        const project = await GitCommandGitProject.cloned(credentials, id);
        const pi: PhaseCreationInvocation = {
            id,
            project,
            credentials,
            push,
            context,
            addressChannels: addressChannelsFor(push.repo, context),
        };
        const phaseCreatorResults: Phases[] = await Promise.all(params.phaseCreators
            .map(async (pc, index) => {
                const relevant = !!pc.guard ? await pc.guard(pi) : true;
                if (relevant) {
                    const phases = pc.createPhases(pi);
                    if (!!phases) {
                        logger.info("Eligible PhaseCreator %s at %d returned phases %j", pc, index, phases);
                    } else {
                        logger.info("Eligible PhaseCreator %s at %d found no phases", pc, index);
                    }
                    return Promise.resolve(phases);
                } else {
                    logger.info("Ineligible PhaseCreator %s at %d will not be invoked", pc, index);
                    return Promise.resolve(undefined);
                }
            }));
        const phases = phaseCreatorResults.find(p => !!p);
        if (phases === ImmaterialPhases) {
            await createStatus(params.githubToken, id, {
                context: "Immaterial",
                state: "success",
                description: "No significant change",
            });
        } else if (!phases) {
            logger.info("No phases satisfied by push to %s:%s on %s", id.owner, id.repo, push.branch);
        } else {
            await phases.setAllToPending(id, credentials);
        }
        return Success;
    }
}

@Parameters()
export class ApplyPhasesParameters {
    @Secret(Secrets.UserToken)
    public githubToken: string;

    @MappedParameter(MappedParameters.GitHubOwner)
    public owner: string;

    @MappedParameter(MappedParameters.GitHubRepository)
    public repo: string;

    @Parameter({required: false})
    public sha?: string;
}

export function applyPhasesToCommit(phases: Phases) {
    return async (ctx: HandlerContext,
                  params: { githubToken: string, owner: string, repo: string, sha?: string }) => {
        const sha = params.sha ? params.sha :
            await tipOfDefaultBranch(params.githubToken, new GitHubRepoRef(params.owner, params.repo));
        const id = new GitHubRepoRef(params.owner, params.repo, sha);
        const creds = {token: params.githubToken};

        await phases.setAllToPending(id, creds);
        await ctx.messageClient.respond(":heavy_check_mark: Statuses reset on " + sha);
        return Success;
    };
}
