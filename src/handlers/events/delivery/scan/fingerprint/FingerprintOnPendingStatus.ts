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

import { HandlerContext, Success } from "@atomist/automation-client/Handlers";

import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { Fingerprint } from "@atomist/automation-client/project/fingerprint/Fingerprint";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { sendFingerprint } from "../../../../../util/webhook/sendFingerprint";

import { HandlerResult } from "@atomist/automation-client";
import * as _ from "lodash";
import { Fingerprinter } from "../../../../../common/listener/Fingerprinter";
import { OnAnyPendingStatus } from "../../../../../typings/types";
import { createStatus } from "../../../../../util/github/ghub";
import { ExecuteGoalInvocation } from "../../deploy/ExecuteGoalOnSuccessStatus";

export function executeFingerprints(...fingerprinters: Fingerprinter[]):
(status: OnAnyPendingStatus.Status, ctx: HandlerContext, params: ExecuteGoalInvocation) => Promise<HandlerResult> {
    return async (status: OnAnyPendingStatus.Status, ctx: HandlerContext, params: ExecuteGoalInvocation) => {
        const id = new GitHubRepoRef(status.commit.repo.owner, status.commit.repo.name, status.commit.pushes[0].after.sha);
        const credentials = { token: params.githubToken };

        if (fingerprinters.length >= 0) {
            const project = await GitCommandGitProject.cloned(credentials, id);
            const fingerprints: Fingerprint[] = await Promise.all(
                fingerprinters.map(async fp => {
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
    };
}

function isFingerprint(a: any): a is Fingerprint {
    const fq = a as Fingerprint;
    return !!fq.sha && !!fq.version;
}
