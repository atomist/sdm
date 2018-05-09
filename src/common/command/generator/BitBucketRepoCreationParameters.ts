import { MappedParameter, MappedParameters, Secret, Secrets } from "@atomist/automation-client";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { NewRepoCreationParameters } from "@atomist/automation-client/operations/generate/NewRepoCreationParameters";
import { BitBucketServerRepoRef } from "../BitBucketServerRepoRef";

// TODO could this be universal
export class BitBucketRepoCreationParameters extends NewRepoCreationParameters {

    @Secret(Secrets.userToken(["repo", "user:email", "read:user"]))
    public githubToken;

    // @MappedParameter(MappedParameters.GitHubWebHookUrl)
    // public webhookUrl: string;

    @MappedParameter(MappedParameters.GitHubApiUrl, false)
    public apiUrl: string;

    get credentials(): ProjectOperationCredentials {
        let creds: ProjectOperationCredentials;
       // if (!this.githubToken || this.githubToken === "null") {
        creds = {
                username: "rod",
                password: "atomist",
            };
        // } else {
        //     creds = {token: this.githubToken};
        // }
        return creds;
    }

    /**
     * Return a single RepoRef or undefined if we're not identifying a single repo
     * This implementation returns a GitHub.com repo but it can be overriden
     * to return any kind of repo
     * @return {RepoRef}
     */
    get repoRef(): RemoteRepoRef {
        return new BitBucketServerRepoRef(
            this.apiUrl,
            this.owner, this.repo,
            true);
    }
}
