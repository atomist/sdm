/*
 * Copyright © 2019 Atomist, Inc.
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

import {
    FingerprintData,
    logger,
    Success,
} from "@atomist/automation-client";
import {
    ExecuteGoal,
    GoalInvocation,
} from "../../api/goal/GoalInvocation";
import { FingerprintListener } from "../../api/listener/FingerprintListener";
import { FingerprinterRegistration } from "../../api/registration/FingerprinterRegistration";
import { minimalClone } from "../goal/minimalClone";
import { computeFingerprints } from "./computeFingerprints";
import { createPushImpactListenerInvocation } from "./createPushImpactListenerInvocation";
import { relevantCodeActions } from "./relevantCodeActions";

/**
 * Execute fingerprinting and send fingerprints to Atomist
 * @param {FingerprinterRegistration} fingerprinters
 * @param listeners listeners to fingerprints
 */
export function executeFingerprinting(fingerprinters: FingerprinterRegistration[],
                                      listeners: FingerprintListener[]): ExecuteGoal {
    return async (goalInvocation: GoalInvocation) => {
        const { goalEvent, configuration, id, credentials, context, preferences, addressChannels } = goalInvocation;
        if (fingerprinters.length === 0) {
            return Success;
        }

        logger.debug("About to fingerprint %j using %d fingerprinters", id, fingerprinters.length);
        await configuration.sdm.projectLoader.doWithProject({
            credentials,
            id,
            readOnly: true,
            cloneOptions: minimalClone(goalEvent.push, { detachHead: true }),
        }, async project => {
            const cri = await createPushImpactListenerInvocation(goalInvocation, project);
            const relevantFingerprinters: FingerprinterRegistration[] = await relevantCodeActions(fingerprinters, cri);
            logger.debug("Will invoke %d eligible fingerprinters of %d to %j",
                relevantFingerprinters.length, fingerprinters.length, cri.project.id);
            const fingerprints: FingerprintData[] = await computeFingerprints(cri, relevantFingerprinters.map(fp => fp.action));
            await Promise.all(listeners.map(l =>
                l({
                    id,
                    context,
                    configuration,
                    credentials,
                    addressChannels,
                    preferences,
                    fingerprints,
                })));
        });
        return Success;
    };
}
