/*
 * Copyright © 2020 Atomist, Inc.
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

import { Octokit } from "@octokit/rest";

/** Arguments for [[createRelease]]. */
export interface ReleaseInfo {
    auth: string;
    baseUrl: string;
    owner: string;
    repo: string;
    version: string;
    sha: string;
    changelog?: string;
}

/**
 * Wrapper around octokit.repos.createRelease to facilitate testing.
 * See https://developer.github.com/v3/repos/releases/#create-a-release
 * and https://octokit.github.io/rest.js/#octokit-routes-repos-create-release
 */
export async function createRelease(releaseInfo: ReleaseInfo): Promise<void> {
    const octokit = new Octokit({
        auth: releaseInfo.auth,
        baseUrl: releaseInfo.baseUrl,
        userAgent: "@atomist/sdm 2.0.0",
    });
    await octokit.repos.createRelease({
        owner: releaseInfo.owner,
        repo: releaseInfo.repo,
        tag_name: releaseInfo.version,
        target_commitish: releaseInfo.sha,
        name: `Release ${releaseInfo.version}`,
        body: releaseInfo.changelog ? `See [CHANGELOG](${releaseInfo.changelog}) for details.` : undefined,
        prerelease: releaseInfo.version.includes("-"),
    });
}
