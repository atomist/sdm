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
import { FingerprintListener } from "../../api/listener/FingerprintListener";

/**
 * Publish the given fingerprint to Atomist in the given team
 * @return {Promise<any>}
 */
export const SendFingerprintToAtomist: FingerprintListener = fli => {
    const url = `https://webhook.atomist.com/atomist/fingerprints/teams/${fli.context.teamId}`;
    const payload = {
        commit: {
            provider: fli.id.providerType,
            owner: fli.id.owner,
            repo: fli.id.repo,
            sha: fli.id.sha,
        },
        fingerprints: [fli.fingerprint],
    };
    logger.info("Sending up fingerprint to %s: %j", url, payload);
    return axios.post(url, payload)
        .catch(err => {
            return Promise.reject(`Axios error calling ${url}: ${err.message}`);
        });
};
