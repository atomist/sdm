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

import { logger } from "@atomist/automation-client";
import { Success } from "@atomist/automation-client/Handlers";
import { Fingerprint } from "@atomist/automation-client/project/fingerprint/Fingerprint";
import { computeFingerprints } from "../../../../api-helper/listener/computeFingerprints";
import { createPushImpactListenerInvocation } from "../../../../api-helper/listener/createPushImpactListenerInvocation";
import { relevantCodeActions } from "../../../../api-helper/listener/relevantCodeActions";
import { ExecuteGoalWithLog, RunWithLogContext } from "../../../../api/goal/ExecuteGoalWithLog";
import { FingerprintListener } from "../../../../api/listener/FingerprintListener";
import { FingerprinterRegistration } from "../../../../api/registration/FingerprinterRegistration";
import { ProjectLoader } from "../../../../spi/project/ProjectLoader";

/**
 * Execute fingerprinting and send fingerprints to Atomist
 * @param projectLoader project loader
 * @param {FingerprinterRegistration} fingerprinters
 * @param listeners listeners to fingerprints
 */
export function executeFingerprinting(projectLoader: ProjectLoader,
                                      fingerprinters: FingerprinterRegistration[],
                                      listeners: FingerprintListener[]): ExecuteGoalWithLog {
    return async (rwlc: RunWithLogContext) => {
        const {id, credentials, context} = rwlc;
        if (fingerprinters.length === 0) {
            return Success;
        }

        logger.debug("About to fingerprint %j using %d fingerprinters", id, fingerprinters.length);
        await projectLoader.doWithProject({credentials, id, readOnly: true}, async project => {
            const cri = await createPushImpactListenerInvocation(rwlc, project);
            const relevantFingerprinters: FingerprinterRegistration[] = await relevantCodeActions(fingerprinters, cri);
            logger.info("Will invoke %d eligible fingerprinters of %d to %j",
                relevantFingerprinters.length, fingerprinters.length, cri.project.id);
            const fingerprints: Fingerprint[] = await computeFingerprints(cri, relevantFingerprinters.map(fp => fp.action));
            await Promise.all(listeners.map(l =>
                Promise.all(fingerprints.map(fingerprint => l({
                    id,
                    context,
                    credentials,
                    addressChannels: cri.addressChannels,
                    fingerprint,
                })))));
        });
        return Success;
    };
}
