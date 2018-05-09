import { MappedParameter, MappedParameters, Parameter, Parameters } from "@atomist/automation-client";
import { BitBucketServerRepoRef } from "@atomist/automation-client/operations/common/BitBucketServerRepoRef";
import { GitBranchRegExp } from "@atomist/automation-client/operations/common/params/gitHubPatterns";
import { TargetsParams } from "@atomist/automation-client/operations/common/params/TargetsParams";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";

/**
 * Base parameters for working with GitHub repo(s).
 * Allows use of regex.
 */
@Parameters()
export class BitBucketTargetsParams extends TargetsParams {

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

    get credentials(): ProjectOperationCredentials {
        throw new Error("Must be overridden");
    }

    constructor() {
        super();
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
