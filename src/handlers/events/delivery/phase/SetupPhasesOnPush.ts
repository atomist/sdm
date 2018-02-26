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

import {
    GraphQL, logger,
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
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { OnAnyPush, OnPushToAnyBranch } from "../../../../typings/types";
import { tipOfDefaultBranch } from "../../../commands/editors/toclient/ghub";
import { Phases } from "../Phases";

/**
 * Return undefined if no phases set up
 */
export type PhaseBuilder = (p: GitProject) => Promise<Phases | undefined>;

export type PushTest = (p: OnAnyPush.Push) => boolean | Promise<boolean>;

export const PushesToMaster: PushTest = p => p.branch === "master";

// TODO should do this but it doesn't work
// export const PushesToMaster: PushTest = p => p.branch === p.repo.defaultBranch;

export const AnyPush: PushTest = p => true;

export class PhaseCreator {

    /**
     * Create a new PhaseCreator that will be used to test a push
     * @param {PhaseBuilder[]} phaseBuilders phase builders to apply to a push with these characteristics
     * @param {PushTest} pushTest test for a push (e.g. is it to master)
     */
    constructor(public phaseBuilders: PhaseBuilder[],
                public pushTest: PushTest) {
    }
}

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
     * @param phaseCreators first PhaseCreator that matches the push and returns
     * phases will win
     */
    constructor(...phaseCreators: PhaseCreator[]) {
        this.phaseCreators = phaseCreators;
    }

    public async handle(event: EventFired<OnPushToAnyBranch.Subscription>, ctx: HandlerContext, params: this): Promise<HandlerResult> {
        const push: OnPushToAnyBranch.Push = event.data.Push[0];
        const commit = push.commits[0];
        const id = new GitHubRepoRef(push.repo.owner, push.repo.name, commit.sha);

        const phaseCreatorResults: boolean[] = await Promise.all(params.phaseCreators
            .map(pc => Promise.resolve(pc.pushTest(push))
                .then(f => f)));
        const firstSatisfiedIndex = phaseCreatorResults.indexOf(true);
        if (firstSatisfiedIndex === -1) {
            logger.info("No phases satisfied by push to %s:%s on %s", id.owner, id.repo, push.branch);
            return Success;
        }
        const phaseBuilders = params.phaseCreators[firstSatisfiedIndex].phaseBuilders;

        const creds = {token: params.githubToken};
        const p = await GitCommandGitProject.cloned(creds, id);
        const phasesFound = await Promise.all(phaseBuilders.map(pb => pb(p)));
        const phases = phasesFound.find(phase => !!phase);
        if (!!phases) {
            await phases.setAllToPending(id, creds);
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
