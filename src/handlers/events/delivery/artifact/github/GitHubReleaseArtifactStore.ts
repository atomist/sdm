import { ArtifactStore, DeployableArtifact } from "../../ArtifactStore";
import { AppInfo } from "../../deploy/Deployment";
import { Stream } from "stream";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { createRelease, createTag, Release, Tag, uploadReleaseAsset } from "../../../../commands/editors/toclient/ghub";
import * as fs from "fs";
import {
    ProjectOperationCredentials,
    TokenCredentials
} from "@atomist/automation-client/operations/common/ProjectOperationCredentials";

export class GitHubReleaseArtifactStore implements ArtifactStore {

    public store(appInfo: AppInfo, what: Stream): Promise<string> {
        throw new Error("Not yet implemented");
    }

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
        const lastSlash = localFile.lastIndexOf("/");
        const filename = localFile.substr(lastSlash + 1);
        const asset = await uploadReleaseAsset(token, grr, release.name, filename,
            localFile);
        return asset.url;
    }

    public checkout(url: string, creds: ProjectOperationCredentials): Promise<DeployableArtifact> {
        throw new Error("Not yet implemented");
    }
}
