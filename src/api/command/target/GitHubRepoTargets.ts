/**
 * Resolve from a Mapped parameter or from a supplied repos regex if no repo mapping
 */
import { MappedParameter, MappedParameters, Parameter } from "@atomist/automation-client";
import { FallbackParams } from "@atomist/automation-client/operations/common/params/FallbackParams";
import { GitBranchRegExp } from "@atomist/automation-client/operations/common/params/gitHubPatterns";
import { GitHubTargetsParams } from "@atomist/automation-client/operations/common/params/GitHubTargetsParams";
import * as assert from "assert";
import { RepoTargets } from "../../machine/RepoTargets";

export class GitHubRepoTargets extends GitHubTargetsParams implements FallbackParams, RepoTargets {

    @MappedParameter(MappedParameters.GitHubOwner, false)
    public owner: string;

    @MappedParameter(MappedParameters.GitHubRepository, false)
    public repo: string;

    @Parameter({ description: "Branch or ref. Defaults to 'master'", ...GitBranchRegExp, required: false })
    public sha: string = "master";

    @Parameter({ description: "regex", required: false })
    public repos: string;

    public bindAndValidate() {
        if (!this.repo) {
            assert(!!this.repos, "Must set repos or repo");
            this.repo = this.repos;
        }
    }

}
