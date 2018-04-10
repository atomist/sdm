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

import { logger } from "@atomist/automation-client";
import { Success } from "@atomist/automation-client/Handlers";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { Fingerprint } from "@atomist/automation-client/project/fingerprint/Fingerprint";
import * as _ from "lodash";
import { sendFingerprint } from "../../../../util/webhook/sendFingerprint";
import { ProjectLoader } from "../../../repo/ProjectLoader";
import { ExecuteGoalWithLog, RunWithLogContext } from "../../goals/support/reportGoalError";
import { relevantCodeActions } from "../CodeActionRegistration";
import { createCodeReactionInvocation } from "../createCodeReactionInvocation";
import { FingerprinterRegistration } from "./FingerprinterRegistration";

/**
 * Execute fingerprinting
 * @param projectLoader project loader
 * @param {FingerprinterRegistration} fingerprinters
 */
export function executeFingerprinting(projectLoader: ProjectLoader,
                                      ...fingerprinters: FingerprinterRegistration[]): ExecuteGoalWithLog {
    return async (rwlc: RunWithLogContext) => {
        const { id, credentials, context } = rwlc;
        if (fingerprinters.length === 0) {
            return Success;
        }

        logger.debug("About to fingerprint %j using %d fingerprinters", id, fingerprinters.length);
        await projectLoader.doWithProject({credentials, id, readOnly: true}, async project => {
            const cri = await createCodeReactionInvocation(rwlc, project);
            const relevantFingerprinters: FingerprinterRegistration[] = await relevantCodeActions(fingerprinters, cri);
            logger.info("Will invoke %d eligible fingerprinters of %d to %j",
                relevantFingerprinters.length, fingerprinters.length, cri.project.id);
            const fingerprints: Fingerprint[] = await Promise.all(
                relevantFingerprinters.map(async fp => {
                    logger.info("Using fingerprinter %s to fingerprint %j", fp.name, id);
                    const f = await fp.action(cri);
                    return isFingerprint(f) ? [f] : f;
                }),
            ).then(x2 => _.flatten(x2));
            fingerprints.map(fingerprint => sendFingerprint(id as GitHubRepoRef, fingerprint, context.teamId));
        });
        return Success;
    };
}

function isFingerprint(a: any): a is Fingerprint {
    const fq = a as Fingerprint;
    return !!fq.sha && !!fq.version;
}
