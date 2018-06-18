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
import { GitHubRepoRef, isGitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { Issue } from "@atomist/automation-client/util/gitHub";
import { doWithRetry } from "@atomist/automation-client/util/retry";
import axios, { AxiosPromise, AxiosRequestConfig } from "axios";
import { toToken } from "../../api-helper/misc/credentials/toToken";

export type State = "error" | "failure" | "pending" | "success";

/**
 * GitHub status
 */
export interface Status {
    state: State;
    target_url?: string;
    description?: string;
    context?: string;
}

/**
 * Create a GitHub status
 * @param {string | ProjectOperationCredentials} creds
 * @param {GitHubRepoRef} rr
 * @param {Status} inputStatus
 * @return {AxiosPromise}
 */
export function createStatus(creds: string | ProjectOperationCredentials, rr: GitHubRepoRef, inputStatus: Status): AxiosPromise {
    const config = authHeaders(toToken(creds));
    const saferStatus = ensureValidUrl(inputStatus);
    const url = `${rr.scheme}${rr.apiBase}/repos/${rr.owner}/${rr.repo}/statuses/${rr.sha}`;
    logger.info("Updating github status: %s to %j", url, saferStatus);
    return doWithRetry(() =>
        axios.post(url, saferStatus, config).catch(err =>
            Promise.reject(new Error(`Error hitting ${url} to set status ${JSON.stringify(saferStatus)}: ${err.message}`)),
        ), `Updating github status: ${url} to ${JSON.stringify(saferStatus)}`, {});
}

/*
 * If you send a targetUrl that doesn't work, GitHub will not accept the status.
 * Commonly on findArtifact, we get a Docker image name instead, and people really want
 * to put that in the URL but it doesn't work.
 *
 * This limitation exists only because we are using GitHub Statuses for Goals right now,
 * and when we move to a custom event it won't be the same problem. So it makes sense
 * to encode the limitation here.
 *
 * Yes the description is going to be ugly. Deal with it.
 */
function ensureValidUrl(inputStatus: Status): Status {

    if (!inputStatus.target_url) {
        return inputStatus;
    }
    if (inputStatus.target_url.startsWith("http")) {
        return inputStatus;
    }
    logger.warn("Illegal to send a non-url in target_url, so I'm appending it to the description");
    return {
        target_url: undefined,
        description: inputStatus.description + " at " + inputStatus.target_url,
        state: inputStatus.state,
        context: inputStatus.context,
    };
}

export interface Tag {
    tag: string;
    message: string;

    /** Commit sha */
    object: string;
    type: string;
    tagger: {
        name: string;
        email: string;
        date: string;
    };
}

export function createTag(creds: string | ProjectOperationCredentials, rr: GitHubRepoRef, tag: Tag): AxiosPromise {
    const config = authHeaders(toToken(creds));
    const url = `${rr.scheme}${rr.apiBase}/repos/${rr.owner}/${rr.repo}/git/tags`;
    logger.info("Updating github tag: %s to %j", url, tag);
    return doWithRetry(() => axios.post(url, tag, config)
        .catch(err =>
            Promise.reject(new Error(`Error hitting ${url} to set tag ${JSON.stringify(tag)}: ${err.message}`)),
        ), `Updating github tag: ${url} to ${JSON.stringify(tag)}`, {});
}

export function createTagReference(creds: string | ProjectOperationCredentials, rr: GitHubRepoRef, tag: Tag): AxiosPromise {
    const config = authHeaders(toToken(creds));
    const url = `${rr.scheme}${rr.apiBase}/repos/${rr.owner}/${rr.repo}/git/refs`;
    logger.info("Creating github reference: %s to %j", url, tag);
    return doWithRetry(() => axios.post(url, {ref: `refs/tags/${tag.tag}`, sha: tag.object}, config)
        .catch(err =>
            Promise.reject(new Error(`Error hitting ${url} to set tag ${JSON.stringify(tag)}: ${err.message}`)),
        ), `Updating github tag: ${url} to ${JSON.stringify(tag)}`, {});
}

export function deleteRepository(creds: string | ProjectOperationCredentials, rr: GitHubRepoRef): AxiosPromise {
    const config = authHeaders(toToken(creds));
    const url = `${rr.scheme}${rr.apiBase}/repos/${rr.owner}/${rr.repo}`;
    logger.info("Deleting repository: %s", url);
    return axios.delete(url, config)
        .catch(err => {
                logger.error(err.message);
                logger.error(err.response.body);
                return Promise.reject(new Error(`Error hitting ${url} to delete repo`));
            },
        );
}

export interface Release {
    tag_name: string;
    target_commitish?: string;
    name?: string;
    body?: string;
    draft?: boolean;
    prerelease?: boolean;
}

export function createRelease(creds: string | ProjectOperationCredentials, rr: GitHubRepoRef, release: Release): AxiosPromise {
    const config = authHeaders(toToken(creds));
    const url = `${rr.scheme}${rr.apiBase}/repos/${rr.owner}/${rr.repo}/releases`;
    logger.info("Updating github release: %s to %j", url, release);
    return doWithRetry(() => axios.post(url, release, config)
        .catch(err =>
            Promise.reject(new Error(`Error hitting ${url} to set release ${JSON.stringify(release)}: ${err.message}`)),
        ), `Updating github release: ${url} to ${JSON.stringify(release)}`, {});
}

export interface GitHubCommitsBetween {
    commits: Array<{
        sha: string;
        author: { login: string };
        commit: { message: string };
    }>;
}

/**
 * List commits between these shas
 * @param {string | ProjectOperationCredentials} creds
 * @param {GitHubRepoRef} rr
 * @param {string} startSha
 * @param {string} endSha
 * @return {Promise<GitHubCommitsBetween>}
 */
export function listCommitsBetween(creds: string | ProjectOperationCredentials,
                                   rr: GitHubRepoRef,
                                   startSha: string,
                                   endSha: string): Promise<GitHubCommitsBetween> {
    const config = authHeaders(toToken(creds));
    const url = `${rr.scheme}${rr.apiBase}/repos/${rr.owner}/${rr.repo}/compare/${startSha}...${endSha}`;
    return axios.get(url, config)
        .then(ap => ap.data);
}

export function authHeaders(token: string): AxiosRequestConfig {
    return token ? {
            headers: {
                Authorization: `token ${token}`,
            },
        }
        : {};
}

export function tipOfDefaultBranch(creds: string | ProjectOperationCredentials, rr: GitHubRepoRef): Promise<string> {
    // TODO: use real default branch
    const config = authHeaders(toToken(creds));
    const url = `${rr.scheme}${rr.apiBase}/repos/${rr.owner}/${rr.repo}/branches/master`;
    return axios.get(url, config)
        .then(ap => ap.data.commit.sha);
}

export function isPublicRepo(creds: string | ProjectOperationCredentials, rr: GitHubRepoRef): Promise<boolean> {
    const config = authHeaders(toToken(creds));
    const url = `${rr.scheme}${rr.apiBase}/repos/${rr.owner}/${rr.repo}`;
    return axios.get(url, config)
        .then(ap => {
            const privateness = ap.data.private;
            logger.info(`Retrieved ${url}. Private is '${privateness}'`);
            return !privateness;
        })
        .catch(err => {
            logger.warn(`Could not access ${url} to determine repo visibility: ${err.message}`);
            return false;
        });
}

// TODO move to client
export function updateIssue(creds: string | ProjectOperationCredentials,
                            rr: RemoteRepoRef,
                            issueNumber: number,
                            issue: Issue): AxiosPromise {
    const grr = isGitHubRepoRef(rr) ? rr : new GitHubRepoRef(rr.owner, rr.repo, rr.sha);
    const url = `${grr.scheme}${grr.apiBase}/repos/${grr.owner}/${grr.repo}/issues/${issueNumber}`;
    logger.debug(`Request to '${url}' to update issue`);
    return axios.patch(url, issue, authHeaders(toToken(creds)));
}

export async function listTopics(creds: string | ProjectOperationCredentials, rr: RemoteRepoRef): Promise<string[]> {
    const headers = {
        headers: {
            ...authHeaders(toToken(creds)).headers,
            Accept: "application/vnd.github.mercy-preview+json",
        },
    };
    const grr = isGitHubRepoRef(rr) ? rr : new GitHubRepoRef(rr.owner, rr.repo, rr.sha);
    const url = `${grr.scheme}${grr.apiBase}/repos/${grr.owner}/${grr.repo}/topics`;
    const topics = await axios.get(url, headers);
    return topics.data.names;
}
