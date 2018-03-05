import { logger } from "@atomist/automation-client";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import {
    ProjectOperationCredentials,
    TokenCredentials,
} from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { doWithRetry } from "@atomist/automation-client/util/retry";
import * as GitHubApi from "@octokit/rest";
import axios from "axios";
import * as fs from "fs";
import * as p from "path";
import * as tmp from "tmp-promise";
import * as URL from "url";
import { ArtifactStore, DeployableArtifact } from "../../../../../spi/artifact/ArtifactStore";
import { AppInfo } from "../../../../../spi/deploy/Deployment";
import { createRelease, createTag, Release, Tag } from "../../../../../util/github/ghub";

export class GitHubReleaseArtifactStore implements ArtifactStore {

    public async storeFile(appInfo: AppInfo, localFile: string, creds: ProjectOperationCredentials): Promise<string> {
        const token = (creds as TokenCredentials).token;

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

    // Note that this Maven specific
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

        // const token = (creds as TokenCredentials).token;
        // const github = api(token);
        // return github.repos.getAsset({owner: id.owner, repo: id.repo, id: url});

        await saveFileAs((creds as TokenCredentials).token, url, outputPath);
        logger.info("Saved url %s to %s", url, outputPath);
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
 * Save the file to local disk
 * @param {string} token
 * @param {string} url
 * @param {string} outputFilename
 * @return {Promise<any>}
 */
function saveFileAs(token: string, url: string, outputFilename: string): Promise<any> {
    return doWithRetry(() => axios.get(url, {
        headers: {
            // TODO why doesn't auth work?
            // "Authorization": `token ${token}`,
            "Accept": "application/octet-stream",
            "Content-Type": "application/zip",
        },
        responseType: "arraybuffer",
    }), `Download ${url} to ${outputFilename}`, {})
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
        .then(result => {
            return github.repos.uploadAsset({
                url: result.data.upload_url,
                file: fs.readFileSync(path).buffer,
                contentType,
                contentLength: fs.statSync(path).size,
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
