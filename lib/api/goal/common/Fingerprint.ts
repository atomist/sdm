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
import axios from "axios";
import { executeFingerprinting } from "../../../api-helper/listener/executeFingerprinting";
import { FingerprintListener } from "../../listener/FingerprintListener";
import { FingerprinterRegistration } from "../../registration/FingerprinterRegistration";
import {
    Goal,
    GoalDefinition,
} from "../Goal";
import { DefaultGoalNameGenerator } from "../GoalNameGenerator";
import {
    FulfillableGoalDetails,
    FulfillableGoalWithRegistrationsAndListeners,
    getGoalDefinitionFrom,
} from "../GoalWithFulfillment";
import { IndependentOfEnvironment } from "../support/environment";

/**
 * Goal that performs fingerprinting. Typically invoked early in a delivery flow.
 */
export class Fingerprint
    extends FulfillableGoalWithRegistrationsAndListeners<FingerprinterRegistration, FingerprintListener> {

    constructor(private readonly goalDetailsOrUniqueName: FulfillableGoalDetails | string = DefaultGoalNameGenerator.generateName("fingerprint"),
                ...dependsOn: Goal[]) {

        super({
            ...FingerprintDefinition,
            ...getGoalDefinitionFrom(goalDetailsOrUniqueName, DefaultGoalNameGenerator.generateName("fingerprint")),
        }, ...dependsOn);

        this.addFulfillment({
            name: `fingerprint-${this.definition.uniqueName}`,
            goalExecutor: executeFingerprinting(this.registrations,
                this.listeners),
        });

        this.listeners.push(SendFingerprintToAtomist);
    }
}

const FingerprintDefinition: GoalDefinition = {
    uniqueName: "fingerprint",
    displayName: "fingerprint",
    environment: IndependentOfEnvironment,
    workingDescription: "Running fingerprint calculations",
    completedDescription: "Fingerprinted",
};

/**
 * Publish the given fingerprint to Atomist in the given team
 * @return {Promise<void>}
 */
const SendFingerprintToAtomist: FingerprintListener = fli => {
    const url = `https://webhook.atomist.com/atomist/fingerprints/teams/${fli.context.workspaceId}`;
    const payload = {
        commit: {
            provider: fli.id.providerType,
            owner: fli.id.owner,
            repo: fli.id.repo,
            sha: fli.id.sha,
        },
        fingerprints: fli.fingerprints,
    };
    try {
        const shortenedPayload = JSON.stringify(payload, limitValueLength);
        logger.info("Sending up fingerprint to %s: %j", url, shortenedPayload);
    } catch (err) {
        return Promise.reject("Unable to stringify your fingerprint. Is it circular? " + err.message);
    }
    return axios.post(url, payload)
        .catch(err => {
            return Promise.reject(`Axios error calling ${url}: ${err.message}`);
        });
};

function limitValueLength(key: string, value: any): string {
    if (!value) {
        return;
    }
    const stringified = JSON.stringify(value);
    if (stringified.length > 1000) {
        return stringified.substr(0, 100) + " ... < plus " + (stringified.length - 100) + " more characters >";
    }
}
