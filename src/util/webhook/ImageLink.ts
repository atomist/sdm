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
import promiseRetry = require("promise-retry");

export interface AtomistBuildRepository {
    owner_name: string;
    name: string;
}

export type AtomistBuildType = "cron" | "pull_request" | "push" | "tag" | "manual";

export type AtomistBuildStatus = "started" | "failed" | "error" | "passed" | "canceled";

export interface AtomistBuild {
    repository: AtomistBuildRepository;
    number?: number;
    name?: string;
    compare_url?: string;
    type: AtomistBuildType;
    pull_request_number?: number;
    build_url?: string;
    status: AtomistBuildStatus;
    id?: string;
    commit: string;
    tag?: string;
    branch?: string;
    provider?: string;
}

export type AtomistWebhookType = "application" | "build" | "link-image";

const DefaultRetryOptions = {
    retries: 10,
    factor: 2,
    minTimeout: 1 * 500,
    maxTimeout: 5 * 1000,
    randomize: true,
};

/**
 * Post to the Atomist generic build webhook URL.  It creates the payload
 * then uses postWebhook.
 *
 * @param owner repository owner, i.e., user or organization
 * @param repo name of repository
 * @param branch commit branch
 * @param commit commit SHA
 * @param status "start", "success", or "fail"
 * @param teamId Atomist team ID
 * @param retryOptions change default retry options
 * @return true if successful, false on failure after retries
 */
export function postBuildWebhook(
    owner: string,
    repo: string,
    branch: string,
    commit: string,
    status: AtomistBuildStatus,
    teamId: string,
    retryOptions = DefaultRetryOptions,
): Promise<boolean> {

    const payload: AtomistBuild = {
        repository: { owner_name: owner, name: repo },
        type: "push",
        status,
        commit,
        branch,
        provider: "GoogleContainerBuilder",
    };
    return postWebhook("build", payload, teamId, retryOptions);
}

export interface AtomistLinkImageGit {
    owner: string;
    repo: string;
    sha: string;
}

export interface AtomistLinkImageDocker {
    image: string;
}

export interface AtomistLinkImage {
    git: AtomistLinkImageGit;
    docker: AtomistLinkImageDocker;
    type: "link-image";
}

/**
 * Post to the Atomist link-image webhook URL.  It creates the payload
 * then uses postWebhook.
 *
 * @param owner repository owner, i.e., user or organization
 * @param repo name of repository
 * @param commit commit SHA
 * @param image Docker image tag, e.g., registry.com/owner/repo:version
 * @param teamId Atomist team ID
 * @param retryOptions change default retry options
 * @return true if successful, false on failure after retries
 */
export function postLinkImageWebhook(
    owner: string,
    repo: string,
    commit: string,
    image: string,
    teamId: string,
    retryOptions = DefaultRetryOptions,
): Promise<boolean> {

    const payload: AtomistLinkImage = {
        git: {
            owner,
            repo,
            sha: commit,
        },
        docker: {
            image,
        },
        type: "link-image",
    };
    return postWebhook("link-image", payload, teamId, retryOptions);
}

/**
 * Post payload to the Atomist webhook URL.  It will retry
 * several times.
 *
 * @param webhook type of webhook
 * @param payload object to post
 * @param teamId Atomist team ID
 * @param retryOptions change default retry options
 * @return true if successful, false on failure after retries
 */
export function postWebhook(
    webhook: AtomistWebhookType,
    payload: any,
    teamId: string,
    retryOptions = DefaultRetryOptions,
): Promise<boolean> {
    logger.info("Posting webhook: %j", payload);

    const baseUrl = process.env.ATOMIST_WEBHOOK_BASEURL || "https://webhook.atomist.com";
    const url = `${baseUrl}/atomist/${webhook}/teams/${teamId}`;
    return promiseRetry(retryOptions, (retry, retryCount) => {
        logger.debug("posting '%j' to '%s' attempt %d", payload, url, retryCount);
        return axios.post(url, payload)
            .then(() => true)
            .catch(err => {
                logger.debug("error posting '%j' to '%s': %j", payload, url, err);
                retry(err);
            });
    })
        .catch(err => {
            logger.error("failed to post '%j' to '%s': %j", payload, url, err);
            return false;
        });
}
