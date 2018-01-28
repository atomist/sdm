import { MappedParameter, MappedParameters, Parameter } from "@atomist/automation-client";
import { GitBranchRegExp } from "@atomist/automation-client/operations/common/params/gitHubPatterns";
import { GitHubTargetsParams } from "@atomist/automation-client/operations/common/params/GitHubTargetsParams";

// TODO pull up to automation-client

/**
 * Resolve from a Mapped parameter or from a supplied repos regex if not found
 */
export class FallbackReposParameters extends GitHubTargetsParams {

    @MappedParameter(MappedParameters.GitHubOwner, false)
    public owner: string;

    @MappedParameter(MappedParameters.GitHubRepository, false)
    public repo: string;

    @Parameter({description: "Branch or ref. Defaults to 'master'", ...GitBranchRegExp, required: false})
    public sha: string;

    @Parameter({description: "regex", required: false})
    public repos: string = ".*";

}
