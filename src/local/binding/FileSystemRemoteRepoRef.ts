import { logger } from "@atomist/automation-client";
import { ActionResult, successOn } from "@atomist/automation-client/action/ActionResult";
import { AbstractRemoteRepoRef } from "@atomist/automation-client/operations/common/AbstractRemoteRepoRef";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef, RepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { Configurable } from "@atomist/automation-client/project/git/Configurable";
import { parseOwnerAndRepo } from "./expandedTreeUtils";

export class FileSystemRemoteRepoRef extends AbstractRemoteRepoRef {

    public static fromDirectory(repositoryOwnerParentDirectory: string,
                                baseDir: string,
                                branch: string,
                                sha: string): RemoteRepoRef {
        const {owner, repo} = parseOwnerAndRepo(repositoryOwnerParentDirectory, baseDir);
        if (!(!!owner && !!repo)) {
            throw new Error(`Cannot resolve directory ${baseDir}`);
        }
        return new FileSystemRemoteRepoRef(repositoryOwnerParentDirectory, owner, repo, branch, sha);
    }

    public createRemote(creds: ProjectOperationCredentials, description: string, visibility): Promise<ActionResult<this>> {
        throw new Error();
    }

    public deleteRemote(creds: ProjectOperationCredentials): Promise<ActionResult<this>> {
        throw new Error();
    }

    public async raisePullRequest(creds: ProjectOperationCredentials,
                                  title: string,
                                  body: string,
                                  head: string,
                                  base: string): Promise<ActionResult<this>> {
        logger.info("Pull request [%s] on %s:%s", title, this.owner, this.repo);
        return successOn(this);
    }

    public async setUserConfig(credentials: ProjectOperationCredentials, project: Configurable): Promise<ActionResult<any>> {
        return null;
    }

    public cloneUrl(): string {
        return `file://${this.repositoryOwnerParentDirectory}/${this.owner}/${this.repo}`;
    }

    public get fileSystemLocation(): string {
        return `${this.repositoryOwnerParentDirectory}/${this.owner}/${this.repo}`;
    }

    constructor(private readonly repositoryOwnerParentDirectory,
                owner: string,
                repo: string,
                public readonly branch: string,
                sha: string) {
        super(null, "http://not.a.real.remote", "http://not.a.real.apiBase",
            owner, repo, sha);
    }

}

export function isFileSystemRemoteRepoRef(rr: RepoRef): rr is FileSystemRemoteRepoRef {
    const maybe = rr as FileSystemRemoteRepoRef;
    return !!maybe.fileSystemLocation;
}
