import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { Fingerprint } from "@atomist/automation-client/project/fingerprint/Fingerprint";

import { logger } from "@atomist/automation-client";
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
