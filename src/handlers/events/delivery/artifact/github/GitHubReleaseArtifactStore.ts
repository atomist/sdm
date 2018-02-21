import { ArtifactStore, DeployableArtifact } from "../../ArtifactStore";
import { AppInfo } from "../../deploy/Deployment";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { createRelease, createTag, Release, Tag } from "../../../../commands/editors/toclient/ghub";
import {
    ProjectOperationCredentials,
    TokenCredentials
} from "@atomist/automation-client/operations/common/ProjectOperationCredentials";

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
        return asset.url;
    }

    public checkout(url: string, creds: ProjectOperationCredentials): Promise<DeployableArtifact> {
        throw new Error("Not yet implemented");
    }
}

import * as p from "path";

export function uploadAsset(token: string,
                            owner: string,
                            repo: string,
                            tag: string,
                            path: string,
                            contentType: string = "application/zip"): Promise<any> {
    const github = api(token);
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
        .catch(console.error);
}

import * as GitHubApi from "@octokit/rest";
import * as URL from "url";
import * as fs from "fs";

export function api(token: string, apiUrl: string = "https://api.github.com/"): GitHubApi {
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