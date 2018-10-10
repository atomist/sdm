/*
 * Copyright © 2018 Atomist, Inc.
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
    BitBucketServerRepoRef,
    MappedParameter,
    MappedParameters,
    Parameter,
    Parameters,
    ProjectOperationCredentials,
    validationPatterns,
    ValidationResult,
} from "@atomist/automation-client";
import { FallbackParams } from "@atomist/automation-client/lib/operations/common/params/FallbackParams";
import { TargetsParams } from "@atomist/automation-client/lib/operations/common/params/TargetsParams";
import {
    RepoTargets,
} from "../../machine/RepoTargets";

/**
 * Targets for working with BitBucket repo(s).
 * Allows use of regex.
 */
@Parameters()
export class BitBucketRepoTargets extends TargetsParams implements FallbackParams, RepoTargets {

    @MappedParameter(MappedParameters.GitHubApiUrl, false)
    public apiUrl: string;

    @MappedParameter(MappedParameters.GitHubOwner, false)
    public owner: string;

    @MappedParameter(MappedParameters.GitHubRepository, false)
    public repo: string;

    @Parameter({ description: "Branch or ref. Defaults to 'master'", ...validationPatterns.GitBranchRegExp, required: false })
    public sha: string = "master";

    @Parameter({ description: "regex", required: false })
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
            new BitBucketServerRepoRef(
                this.apiUrl,
                this.owner, this.repo,
                true,
                this.sha) :
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
