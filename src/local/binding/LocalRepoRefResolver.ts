import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { SdmGoal } from "../../ingesters/sdmGoalIngester";
import { RepoRefResolver } from "../../spi/repo-ref/RepoRefResolver";
import { CoreRepoFieldsAndChannels, OnPushToAnyBranch, ScmProvider, StatusForExecuteGoal } from "../../typings/types";
import { FileSystemRemoteRepoRef } from "./FileSystemRemoteRepoRef";

export class LocalRepoRefResolver implements RepoRefResolver {

    public providerIdFromPush(push: OnPushToAnyBranch.Push): string | null {
        return "local";
    }

    public providerIdFromStatus(status: StatusForExecuteGoal.Fragment): string | null {
        throw new Error();
    }

    public repoRefFromPush(push: OnPushToAnyBranch.Push): RemoteRepoRef {
        return new FileSystemRemoteRepoRef(this.repositoryOwnerParentDirectory,
            push.repo.owner, push.repo.name, push.branch, push.commits[0].sha);
    }

    public repoRefFromSdmGoal(sdmGoal: SdmGoal, provider: ScmProvider.ScmProvider): RemoteRepoRef {
        throw new Error("not implemented");
    }

    public toRemoteRepoRef(repo: CoreRepoFieldsAndChannels.Fragment, opts: { sha?: string; branch?: string }): RemoteRepoRef {
        return new FileSystemRemoteRepoRef(this.repositoryOwnerParentDirectory,
            repo.owner, repo.name, opts.branch, opts.sha);
    }

    constructor(public readonly repositoryOwnerParentDirectory: string) {}

}
