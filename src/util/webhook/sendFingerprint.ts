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
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { Fingerprint } from "@atomist/automation-client/project/fingerprint/Fingerprint";
import axios from "axios";

export function sendFingerprint(id: GitHubRepoRef, fingerprint: Fingerprint, team: string): Promise<any> {
    const url = `https://webhook.atomist.com/atomist/fingerprints/teams/${team}`;
    const payload = {
        commit: {
            provider: "https://www.github.com",
            owner: id.owner,
            repo: id.repo,
            sha: id.sha,
        },
        fingerprints: [fingerprint],
    };
    logger.info(`Sending up fingerprint to ${url}: ${JSON.stringify(payload)}`);
    return axios.post(url, payload)
        .catch(err => {
            return Promise.reject(`Axios error calling ${url}: ${err.message}`);
        });
}
