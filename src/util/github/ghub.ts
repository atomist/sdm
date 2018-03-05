import { logger } from "@atomist/automation-client";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { doWithRetry } from "@atomist/automation-client/util/retry";
import axios, { AxiosPromise, AxiosRequestConfig } from "axios";

export type State = "error" | "failure" | "pending" | "success";

export interface Status {
    state: State;
    target_url?: string;
    description?: string;
    context?: string;
}

export function createStatus(token: string, rr: GitHubRepoRef, status: Status): AxiosPromise {
    const config = authHeaders(token);
    const url = `${rr.apiBase}/repos/${rr.owner}/${rr.repo}/statuses/${rr.sha}`;
    logger.info("Updating github status: %s to %j", url, status);
    return doWithRetry(() => axios.post(url, status, config)
        .catch(err =>
            Promise.reject(new Error(`Error hitting ${url} to set status ${JSON.stringify(status)}: ${err.message}`)),
        ), `Updating github status: ${url} to ${JSON.stringify(status)}`, {});
}

export function listStatuses(token: string, rr: GitHubRepoRef): Promise<Status[]> {
    const config = authHeaders(token);
    const url = `${rr.apiBase}/repos/${rr.owner}/${rr.repo}/commits/${rr.sha}/statuses`;
    return axios.get(url, config)
        .then(ap => ap.data);
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

export function createTag(token: string, rr: GitHubRepoRef, tag: Tag): AxiosPromise {
    const config = authHeaders(token);
    const url = `${rr.apiBase}/repos/${rr.owner}/${rr.repo}/git/tags`;
    logger.info("Updating github tag: %s to %j", url, tag);
    return doWithRetry(() => axios.post(url, tag, config)
        .catch(err =>
            Promise.reject(new Error(`Error hitting ${url} to set tag ${JSON.stringify(tag)}: ${err.message}`)),
        ), `Updating github tag: ${url} to ${JSON.stringify(tag)}`, {});
}

export function deleteRepository(token: string, rr: GitHubRepoRef): AxiosPromise {
    const config = authHeaders(token);
    const url = `${rr.apiBase}/repos/${rr.owner}/${rr.repo}`;
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

export function createRelease(token: string, rr: GitHubRepoRef, release: Release): AxiosPromise {
    const config = authHeaders(token);
    const url = `${rr.apiBase}/repos/${rr.owner}/${rr.repo}/releases`;
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

export function listCommitsBetween(token: string, rr: GitHubRepoRef, startSha: string, end: string): Promise<GitHubCommitsBetween> {
    const config = authHeaders(token);
    const url = `${rr.apiBase}/repos/${rr.owner}/${rr.repo}/compare/${startSha}...${end}`;
    return axios.get(url, config)
        .then(ap => ap.data);
}

function authHeaders(token: string): AxiosRequestConfig {
    return token ? {
            headers: {
                Authorization: `token ${token}`,
            },
        }
        : {};
}

export function tipOfDefaultBranch(token: string, rr: GitHubRepoRef): Promise<string> {
    // TODO: use real default branch
    const defaultBranch = "master";
    const config = authHeaders(token);
    const url = `${rr.apiBase}/repos/${rr.owner}/${rr.repo}/branches/master`;
    return axios.get(url, config)
        .then(ap => ap.data.commit.sha);
}

export function isPublicRepo(token: string, rr: GitHubRepoRef): Promise<boolean> {
    const config = authHeaders(token);
    const url = `${rr.apiBase}/repos/${rr.owner}/${rr.repo}`;
    return axios.get(url, config)
        .then(ap => {
            const privateness = ap.data.private;
            logger.info(`Retrieved ${url}. Visibility is: ${privateness}`);
            return !privateness;
        })
        .catch(ap => {
            logger.warn(`Could not access ${url}: ${ap.response.status}`);
            return false;
        });
}
