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
    GraphQL,
    MappedParameter,
    MappedParameters,
    Parameter,
    Secret,
    Secrets,
    Success, success
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
import { OnAnyPush, OnPush, OnPushToAnyBranch } from "../../../typings/types";
import { tipOfDefaultBranch } from "../../commands/editors/toclient/ghub";
import { Phases } from "./Phases";

export type PhaseBuilder = (p: GitProject) => Promise<Phases>;

export type PushTest = (p: OnAnyPush.Push) => boolean | Promise<boolean>;

export const PushesToMaster: PushTest = p => p.branch === "master";

/**
 * Scan code on a push to master. Result is setting GitHub status with context = "scan"
 */
@EventHandler("Scan code on master",
    GraphQL.subscriptionFromFile("../../../../../graphql/subscription/OnPushToAnyBranch.graphql",
        __dirname))
export class SetupPhasesOnPush implements HandleEvent<OnPushToAnyBranch.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    constructor(private phaseBuilder: PhaseBuilder, private pushTest) {
    }

    public handle(event: EventFired<OnPushToAnyBranch.Subscription>, ctx: HandlerContext, params: this): Promise<HandlerResult> {
        const push: OnPush.Push = event.data.Push[0];

        if (!this.pushTest(push)) {
            return Promise.resolve(Success);
        }

        const commit = push.commits[0];

        const id = new GitHubRepoRef(push.repo.owner, push.repo.name, commit.sha);

        const creds = {token: params.githubToken};

        return GitCommandGitProject.cloned(creds, id)
            .then(p => params.phaseBuilder(p))
            .then(phases => {
                if (!!phases) {
                    return phases.setAllToPending(id, creds);
                } else {
                    return Promise.resolve();
                }
            }).then(() => Success);
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
