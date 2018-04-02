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
import { Fingerprint } from "@atomist/automation-client/project/fingerprint/Fingerprint";
import * as _ from "lodash";
import { sendFingerprint } from "../../../../util/webhook/sendFingerprint";
import { Fingerprinter } from "../../../listener/Fingerprinter";
import { ProjectLoader } from "../../../repo/ProjectLoader";
import { ExecuteGoalWithLog, RunWithLogContext } from "../../deploy/runWithLog";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";

/**
 * Execute fingerprinting
 * @param projectLoader project loader
 * @param {Fingerprinter} fingerprinters
 */
export function executeFingerprinting(projectLoader: ProjectLoader,
                                      ...fingerprinters: Fingerprinter[]): ExecuteGoalWithLog {
    return async (rwlc: RunWithLogContext) => {
        const { id, credentials, context } = rwlc;

        if (fingerprinters.length === 0) {
            return Success;
        }

        logger.debug("About to fingerprint %j using %d fingerprinters", id, fingerprinters.length);
        await projectLoader.doWithProject({credentials, id, readOnly: true}, async project => {
            const fingerprints: Fingerprint[] = await Promise.all(
                fingerprinters.map(async fp => {
                    logger.info("Using fingerprinter %s to fingerprint %j", fp.name, id);
                    const f = await fp.fingerprint(project);
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
