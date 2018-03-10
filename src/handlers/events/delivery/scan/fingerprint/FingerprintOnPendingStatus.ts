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

import { GraphQL, Secret, Secrets } from "@atomist/automation-client";
import {
    EventFired,
    EventHandler,
    HandleEvent,
    HandlerContext,
    HandlerResult,
    Success,
} from "@atomist/automation-client/Handlers";

import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { Fingerprint } from "@atomist/automation-client/project/fingerprint/Fingerprint";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import * as schema from "../../../../../typings/types";
import { sendFingerprint } from "../../../../../util/webhook/sendFingerprint";

import * as _ from "lodash";
import { currentGoalIsStillPending, GitHubStatusAndFriends, Goal } from "../../../../../common/goals/Goal";
import { Fingerprinter } from "../../../../../common/listener/Fingerprinter";
import { createStatus } from "../../../../../util/github/ghub";

/**
 * Fingerprint on any push
 */
@EventHandler("Fingerprint a commit when that goal is set",
    GraphQL.subscriptionFromFile("graphql/subscription/OnAnyPendingStatus.graphql"))
export class FingerprintOnPendingStatus
    implements HandleEvent<schema.OnAnyPendingStatus.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    constructor(public goal: Goal, private fingerprinters: Fingerprinter[]) {
    }

    public async handle(event: EventFired<schema.OnAnyPendingStatus.Subscription>, ctx: HandlerContext, params: this): Promise<HandlerResult> {
        const status = event.data.Status[0];
        const id = new GitHubRepoRef(status.commit.repo.owner, status.commit.repo.name, status.commit.pushes[0].after.sha);
        const credentials = { token: params.githubToken };

        const statusAndFriends: GitHubStatusAndFriends = {
            context: status.context,
            state: status.state,
            targetUrl: status.targetUrl,
            description: status.description,
            siblings: status.commit.statuses,
        };
        if (!currentGoalIsStillPending(params.goal.context, statusAndFriends)) {
            return Success;
        }
        if (!params.goal.preconditionsMet(credentials, id, event.data)) {
            return Success;
        }

        if (params.fingerprinters.length >= 0) {
            const project = await GitCommandGitProject.cloned({token: params.githubToken}, id);
            const fingerprints: Fingerprint[] = await Promise.all(
                params.fingerprinters.map(async fp => {
                    const f = await fp(project);
                    return isFingerprint(f) ? [f] : f;
                }),
            ).then(x2 => _.flatten(x2));
            await fingerprints.map(fingerprint => sendFingerprint(id, fingerprint, ctx.teamId));
        }
        createStatus(params.githubToken, id, {
            context: params.goal.context,
            state: "success",
            description: params.goal.completedDescription,
        });
        return Success;
    }
}

function isFingerprint(a: any): a is Fingerprint {
    const fq = a as Fingerprint;
    return !!fq.sha && !!fq.version;
}
