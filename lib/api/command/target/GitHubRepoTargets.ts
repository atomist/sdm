/**
 * Resolve from a Mapped parameter or from a supplied repos regex if no repo mapping
 */
import {
    MappedParameter,
    MappedParameters,
    Parameter,
    validationPatterns,
    ValidationResult,
} from "@atomist/automation-client";
import { FallbackParams } from "@atomist/automation-client/lib/operations/common/params/FallbackParams";
import { GitHubTargetsParams } from "@atomist/automation-client/lib/operations/common/params/GitHubTargetsParams";
import { RepoTargets } from "../../machine/RepoTargets";

export class GitHubRepoTargets extends GitHubTargetsParams implements FallbackParams, RepoTargets {

    @MappedParameter(MappedParameters.GitHubOwner, false)
    public owner: string;

    @MappedParameter(MappedParameters.GitHubRepository, false)
    public repo: string;

    @Parameter({ description: "Ref", ...validationPatterns.GitShaRegExp, required: false })
    public sha: string;

    @Parameter({ description: "Branch", ...validationPatterns.GitBranchRegExp, required: false })
    public branch: string = "master";

    @Parameter({ description: "regex", required: false })
    public repos: string;

    public bindAndValidate(): ValidationResult {
        if (!this.repo) {
            if (!this.repos) {
                return {
                    message:
                        "If not executing in a mapped channel, must identify a repo via: `targets.owner` and `targets.repo`, " +
                        "or a repo name regex via `targets.repos`",
                };
            }
            this.repo = this.repos;
        }
    }

}
