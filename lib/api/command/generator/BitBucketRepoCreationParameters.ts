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
    BitBucketServerRepoRef,
    MappedParameter,
    MappedParameters,
    ProjectOperationCredentials,
    RemoteRepoRef,
    Secret,
    Secrets,
} from "@atomist/automation-client";
import { NewRepoCreationParameters } from "@atomist/automation-client/lib/operations/generate/NewRepoCreationParameters";

// TODO could this be universal
export class BitBucketRepoCreationParameters extends NewRepoCreationParameters {

    @Secret(Secrets.userToken(["repo", "user:email", "read:user"]))
    public githubToken: string;

    // @MappedParameter(MappedParameters.GitHubWebHookUrl)
    // public webhookUrl: string;

    @MappedParameter(MappedParameters.GitHubApiUrl, false)
    public apiUrl: string;

    get credentials(): ProjectOperationCredentials {
        throw new Error("Override this");
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
