import { BitBucketServerRepoRef } from "@atomist/automation-client/operations/common/BitBucketServerRepoRef";
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

import { MappedParameter, MappedParameters, Parameter, Parameters } from "@atomist/automation-client";
import { FallbackParams } from "@atomist/automation-client/operations/common/params/FallbackParams";
import { GitBranchRegExp } from "@atomist/automation-client/operations/common/params/gitHubPatterns";
import { TargetsParams } from "@atomist/automation-client/operations/common/params/TargetsParams";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";

/**
 * Base parameters for working with GitHub repo(s).
 * Allows use of regex.
 */
@Parameters()
export class BitBucketTargetsParams extends TargetsParams implements FallbackParams {

    @MappedParameter(MappedParameters.GitHubApiUrl, false)
    public apiUrl: string;

    @MappedParameter(MappedParameters.GitHubOwner, false)
    public owner: string;

    @MappedParameter(MappedParameters.GitHubRepository, false)
    public repo: string;

    @Parameter({ description: "Branch or ref. Defaults to 'master'", ...GitBranchRegExp, required: false })
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

}
