/**
 * Base parameters for working with GitHub repo(s).
 * Allows use of regex.
 */
import { HandlerContext, MappedParameter, MappedParameters, Parameter, Parameters } from "@atomist/automation-client";
import { TargetsParams } from "@atomist/automation-client/operations/common/params/TargetsParams";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { BitBucketServerRepoRef } from "@atomist/automation-client/operations/common/BitBucketServerRepoRef";
import { CredentialsResolver } from "../../handlers/common/CredentialsResolver";
import { GitBranchRegExp } from "@atomist/automation-client/operations/common/params/gitHubPatterns";

@Parameters()
export abstract class BitBucketTargetsParams extends TargetsParams {

    @MappedParameter(MappedParameters.GitHubApiUrl, false)
    public apiUrl: string;

    @MappedParameter(MappedParameters.GitHubOwner, false)
    public owner: string;

    @MappedParameter(MappedParameters.GitHubRepository, false)
    public repo: string;

    @Parameter({description: "Branch or ref. Defaults to 'master'", ...GitBranchRegExp, required: false})
    public sha: string = "master";

    @Parameter({description: "regex", required: false})
    public repos: string = ".*";

    public readonly credentials: ProjectOperationCredentials;

    constructor(context: HandlerContext, credentialsResolver: CredentialsResolver) {
        super();
        this.credentials = credentialsResolver.commandHandlerCredentials(context);
    }

    /**
     * Return a single RepoRef or undefined if we're not identifying a single repo
     * @return {RepoRef}
     */
    get repoRef(): BitBucketServerRepoRef {
        return (!!this.owner && !!this.repo && !this.usesRegex) ?
            new BitBucketServerRepoRef(this.apiUrl, this.owner, this.repo, false, this.sha) :
            undefined;
    }

}
