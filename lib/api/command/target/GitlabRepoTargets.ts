/*
 * Copyright © 2019 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
    MappedParameter,
    MappedParameters,
    Parameter,
    Parameters,
} from "@atomist/automation-client/lib/decorators";
import { GitlabRepoRef } from "@atomist/automation-client/lib/operations/common/GitlabRepoRef";
import { FallbackParams } from "@atomist/automation-client/lib/operations/common/params/FallbackParams";
import { TargetsParams } from "@atomist/automation-client/lib/operations/common/params/TargetsParams";
import { ProjectOperationCredentials } from "@atomist/automation-client/lib/operations/common/ProjectOperationCredentials";
import { ValidationResult } from "@atomist/automation-client/lib/SmartParameters";
import { RepoTargets } from "../../machine/RepoTargets";
import {
    GitBranchRegExp,
    GitShaRegExp,
} from "../support/commonValidationPatterns";

/**
 * Targets for working with BitBucket repo(s).
 * Allows use of regex.
 */
@Parameters()
export class GitlabRepoTargets extends TargetsParams implements FallbackParams, RepoTargets {

    @MappedParameter(MappedParameters.GitHubApiUrl, false)
    public apiUrl: string;

    @MappedParameter(MappedParameters.GitHubUrl, false)
    public url: string;

    @MappedParameter(MappedParameters.GitHubOwner, false)
    public owner: string;

    @MappedParameter(MappedParameters.GitHubRepository, false)
    public repo: string;

    @Parameter({ description: "Ref", ...GitShaRegExp, required: false })
    public sha: string;

    @Parameter({ description: "Branch Defaults to 'master'", ...GitBranchRegExp, required: false })
    public branch: string = "master";

    @Parameter({ description: "regex", required: false })
    public repos: string;

    get credentials(): ProjectOperationCredentials {
        return undefined;
    }

    constructor() {
        super();
    }

    /**
     * Return a single RepoRef or undefined if we're not identifying a single repo
     * @return {RepoRef}
     */
    get repoRef(): GitlabRepoRef {
        return (!!this.owner && !!this.repo && !this.usesRegex) ?
            GitlabRepoRef.from({
                owner: this.owner,
                repo: this.repo,
                sha: this.sha,
                branch: this.branch,
                rawApiBase: this.apiUrl,
                gitlabRemoteUrl: this.url,
            }) :
            undefined;
    }

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
