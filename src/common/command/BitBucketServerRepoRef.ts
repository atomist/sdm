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
import { ActionResult, successOn } from "@atomist/automation-client/action/ActionResult";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { ProviderType } from "@atomist/automation-client/operations/common/RepoId";

import { isBasicAuthCredentials } from "@atomist/automation-client/operations/common/BasicAuthCredentials";
import { Configurable } from "@atomist/automation-client/project/git/Configurable";
import axios from "axios";
import { encode } from "../../util/misc/base64";
import { spawnAndWatch } from "../../util/misc/spawned";
import { LoggingProgressLog } from "../log/LoggingProgressLog";
import { AbstractRemoteRepoRef } from "./AbstractRemoteRepoRef";

/**
 * RemoteRepoRef implementation for BitBucket server (not BitBucket Cloud)
 *
 * This should ultimately move to automation-client-ts
 */
export class BitBucketServerRepoRef extends AbstractRemoteRepoRef {

    public readonly ownerType: "projects" | "users";

    /**
     * Construct a new BitBucketServerRepoRef
     * @param {string} remoteBase remote base, including scheme
     * @param {string} owner
     * @param {string} repo
     * @param {boolean} isProject
     * @param {string} sha
     * @param {string} path
     */
    constructor(remoteBase: string,
                owner: string,
                repo: string,
                private readonly isProject: boolean = true,
                sha: string = "master",
                path?: string) {
        super(ProviderType.bitbucket, remoteBase, owner, repo, sha, path);
        this.ownerType = isProject ? "projects" : "users";
        logger.info("Constructed BitBucketServerRepoRef: %j", this);
    }

    public createRemote(creds: ProjectOperationCredentials, description: string, visibility): Promise<ActionResult<this>> {
        const url = `${this.scheme}${this.apiBase}/${this.apiBasePathComponent}`;
        const data = {
            name: this.repo,
            scmId: "git",
            forkable: "true",
        };
        const hdrs = headers(creds);
        logger.info("Making request to BitBucket '%s' to create repo, data=%j, headers=%j", url, data, hdrs);
        return this.postWithCurl(creds, url, data)
            .catch(error => {
                logger.error("Error attempting to create repository %j: %s", this, error);
                return Promise.reject(error);
            });
    }

    private postWithCurl(creds: ProjectOperationCredentials, url: string, data: any) {
        return spawnAndWatch({
            command: "curl", args: [
                "-u", usernameColonPassword(creds),
                "-X", "POST",
                "-H", "Content-Type: application/json",
                "-d", JSON.stringify(data),
                url,
            ],
        }, {}, new LoggingProgressLog("postWithCurl"))
            .then(curlResponse => {
                return {
                    target: this,
                    success: true,
                    curlResponse,
                };
            });
    }

    public deleteRemote(creds: ProjectOperationCredentials): Promise<ActionResult<this>> {
        const url = `${this.scheme}${this.apiBase}/${this.apiPathComponent}`;
        logger.debug(`Making request to '${url}' to delete repo`);
        return axios.delete(url, headers(creds))
            .then(axiosResponse => {
                return {
                    target: this,
                    success: true,
                    axiosResponse,
                };
            })
            .catch(err => {
                logger.error(`Error attempting to delete repository: ${err}`);
                return Promise.reject(err);
            });
    }

    public setUserConfig(credentials: ProjectOperationCredentials, project: Configurable): Promise<ActionResult<any>> {
        return Promise.resolve(successOn(this));
    }

    public raisePullRequest(credentials: ProjectOperationCredentials,
                            title: string, body: string, head: string, base: string): Promise<ActionResult<this>> {
        const url = `${this.scheme}${this.apiBase}/${this.apiPathComponent}/pull-requests`;
        logger.debug(`Making request to '${url}' to raise PR`);
        return this.postWithCurl(credentials, url, {
            title,
            description: body,
            fromRef: {
                id: head,
            },
            toRef: {
                id: base,
            },
        }) .catch(err => {
                logger.error(`Error attempting to raise PR: ${err}`);
                return Promise.reject(err);
            });
    }

    get url() {
        let url: string = `projects/${this.owner}/repos`;
        if (!this.isProject) {
            url = `users/${this.owner}/repos`;
        }
        return `${this.scheme}${this.remoteBase}/${url}/${this.repo}`;
    }

    get pathComponent(): string {
        return `scm/${this.maybeTilde}${this.owner}/${this.repo}`;
    }

    private get maybeTilde() {
        return this.isProject ? "" : "~";
    }

    private get apiBasePathComponent(): string {
        return `rest/api/1.0/projects/${this.maybeTilde}${this.owner}/repos/`;
    }

    get apiPathComponent(): string {
        return this.apiBasePathComponent + this.repo;
    }

}

function usernameColonPassword(creds: ProjectOperationCredentials): string {
    if (!isBasicAuthCredentials(creds)) {
        throw new Error("Only Basic auth supported: Had " + JSON.stringify(creds));
    }
    return `${creds.username}:${creds.password}`;
}

function headers(creds: ProjectOperationCredentials) {
    const encoded = encode(usernameColonPassword(creds));
    return {
        headers: {
            Authorization: `Basic ${encoded}`,
        },
    };
}
