/*
 * Copyright © 2018 Atomist, Inc.
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
import * as _ from "lodash";
import { OnAnyPendingStatus } from "../../../../typings/types";
import { sendFingerprint } from "../../../../util/webhook/sendFingerprint";
import { Fingerprinter } from "../../../listener/Fingerprinter";
import { ProjectLoader } from "../../../repo/ProjectLoader";
import { ExecuteGoalInvocation, GoalExecutor } from "../../goals/goalExecution";

/**
 * Execute fingerprinting
 * @param projectLoader project loader
 * @param {Fingerprinter} fingerprinters
 */
export function executeFingerprinting(projectLoader: ProjectLoader, ...fingerprinters: Fingerprinter[]): GoalExecutor {
    return async (status: OnAnyPendingStatus.Status, context: HandlerContext, params: ExecuteGoalInvocation) => {
        const id = new GitHubRepoRef(status.commit.repo.owner, status.commit.repo.name, status.commit.pushes[0].after.sha);
        const credentials = {token: params.githubToken};

        if (fingerprinters.length === 0) {
            return Success;
        }

        await projectLoader.doWithProject({credentials, id}, async project => {
            const fingerprints: Fingerprint[] = await Promise.all(
                fingerprinters.map(async fp => {
                    const f = await fp(project);
                    return isFingerprint(f) ? [f] : f;
                }),
            ).then(x2 => _.flatten(x2));
            await fingerprints.map(fingerprint => sendFingerprint(id, fingerprint, context.teamId));
        });
        return Success;
    };
}

function isFingerprint(a: any): a is Fingerprint {
    const fq = a as Fingerprint;
    return !!fq.sha && !!fq.version;
}
