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
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { doWithRetry } from "@atomist/automation-client/util/retry";
import * as GitHubApi from "@octokit/rest";
import axios from "axios";
import * as fs from "fs";
import * as p from "path";
import * as tmp from "tmp-promise";
import * as URL from "url";
import { promisify } from "util";
import { toToken } from "../../../api-helper/misc/credentials/toToken";
import { ArtifactStore, DeployableArtifact } from "../../../spi/artifact/ArtifactStore";
import { AppInfo } from "../../../spi/deploy/Deployment";
import { authHeaders, createRelease, createTag, Release, Tag } from "../../../util/github/ghub";

/**
 * Implement ArtifactStore interface to store artifacts as GitHub releases
 */
export class GitHubReleaseArtifactStore implements ArtifactStore {

    public async storeFile(appInfo: AppInfo, localFile: string, creds: ProjectOperationCredentials): Promise<string> {
        const token = toToken(creds);
        const tagName = appInfo.version + new Date().getMilliseconds();
        const tag: Tag = {
            tag: tagName,
            message: appInfo.version + " for release",
            object: appInfo.id.sha,
            type: "commit",
            tagger: {
                name: "Atomist",
                email: "info@atomist.com",
                date: new Date().toISOString(),
            },
        };
        const grr = appInfo.id as GitHubRepoRef;
        await createTag(token, grr, tag);
        const release: Release = {
            name: appInfo.version,
            tag_name: tag.tag,
        };
        await createRelease(token, grr, release);
        const asset = await uploadAsset(token, grr.owner, grr.repo, tag.tag, localFile);
        logger.info("Uploaded artifact with url [%s] for %j", asset.browser_download_url, appInfo);
        return asset.browser_download_url;
    }

    // TODO this is Maven specific
    // Name is of format fintan-0.1.0-SNAPSHOT.jar
    public async checkout(url: string, id: RemoteRepoRef, creds: ProjectOperationCredentials): Promise<DeployableArtifact> {
        logger.info("Attempting to download artifact [%s] for %j", url, id);
        const tmpDir = tmp.dirSync({unsafeCleanup: true});
        const cwd = tmpDir.name;
        const lastSlash = url.lastIndexOf("/");
        const filename = url.substring(lastSlash + 1);
        const re = /([a-zA-Z0-9_]+)-(.*)/;
        const match = re.exec(filename);
        const name = match[1];
        const version = match[2].replace(/.jar$/, "");

        const outputPath = cwd + "/" + filename;
        logger.info("Attempting to download url %s to %s", url, outputPath);
        await downloadFileAs(creds, url, outputPath);
        logger.info("Successfully download url %s to %s", url, outputPath);
        return {
            cwd,
            filename,
            name,
            version,
            id,
        };
    }
}

/**
 * Download the file to local disk
 * @param creds credentials
 * @param {string} url
 * @param {string} outputFilename
 * @return {Promise<any>}
 */
function downloadFileAs(creds: ProjectOperationCredentials, url: string, outputFilename: string): Promise<any> {
    const token = toToken(creds);
    return doWithRetry(() => axios.get(url, {
        ...authHeaders(token),
        headers: {
            "Accept": "application/octet-stream",
            "Content-Type": "application/zip",
        },
        responseType: "arraybuffer",
    }), `Download ${url} to ${outputFilename}`, {
        minTimeout: 10000,
        maxTimeout: 10100,
        retries: 10,
    })
        .then(result => {
            return fs.writeFileSync(outputFilename, result.data);
        });
}

export interface Asset {
    url: string;
    browser_download_url: string;
    name: string;
}

export function uploadAsset(token: string,
                            owner: string,
                            repo: string,
                            tag: string,
                            path: string,
                            contentType: string = "application/zip"): Promise<Asset> {
    const github = githubApi(token);
    return github.repos.getReleaseByTag({
        owner,
        repo,
        tag,
    })
        .then(async result => {
            const file = (await promisify(fs.readFile)(path)).buffer;
            const contentLength = (await promisify(fs.stat)(path)).size;
            return github.repos.uploadAsset({
                url: result.data.upload_url,
                file,
                contentType,
                contentLength,
                name: p.basename(path),
            });
        })
        .then(r => r.data);
}

export function githubApi(token: string, apiUrl: string = "https://api.github.com/"): GitHubApi {
    // separate the url
    const url = URL.parse(apiUrl);

    const gitHubApi = new GitHubApi({
        host: url.hostname,
        protocol: url.protocol.slice(0, -1),
        port: +url.port,
    });

    gitHubApi.authenticate({type: "token", token});
    return gitHubApi;
}
