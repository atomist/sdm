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
import { RemoteLocator } from "@atomist/automation-client/lib/operations/common/params/RemoteLocator";
import { GitHubRepoCreationParameters } from "@atomist/automation-client/lib/operations/generate/GitHubRepoCreationParameters";
import { NewRepoCreationParameters } from "@atomist/automation-client/lib/operations/generate/NewRepoCreationParameters";
import { SeedDrivenGeneratorParameters } from "@atomist/automation-client/lib/operations/generate/SeedDrivenGeneratorParameters";
import {
    GitHubNameRegExp,
    SemVerRegExp,
} from "../support/commonValidationPatterns";
import { GeneratorConfig } from "./GeneratorConfig";

/**
 * Convenient base class for project generator parameters.
 */
@Parameters()
export class SeedDrivenGeneratorParametersSupport implements SeedDrivenGeneratorParameters {

    @MappedParameter(MappedParameters.SlackUserName)
    public screenName: string;

    @Parameter({
        ...SemVerRegExp,
        required: true,
        order: 52,
    })
    public version: string = "0.1.0-SNAPSHOT";

    @Parameter({
        displayName: "Seed repository override",
        description: "Seed repository name",
        ...GitHubNameRegExp,
        minLength: 1,
        maxLength: 50,
        required: false,
    })
    public seed: string;

    @Parameter({
        displayName: "Seed repository owner override",
        description: "Seed repository owner",
        ...GitHubNameRegExp,
        minLength: 1,
        maxLength: 50,
        required: false,
    })
    public seedOwner: string;

    public target: NewRepoCreationParameters = new GitHubRepoCreationParameters();

    @MappedParameter(MappedParameters.SlackTeam)
    public slackTeam: string;

    get description(): string {
        return this.target.description;
    }

    /**
     * Resolve the seed repo
     * @return {RemoteLocator}
     */
    get source(): RemoteLocator {
        if (!this.config) {
            throw new Error("config must be supplied to get source from parameters object");
        }
        const repoRef = this.config.seed();
        repoRef.repo = this.seed || repoRef.repo;
        repoRef.owner = this.seedOwner || repoRef.owner;
        return { repoRef };
    }

    public constructor(private readonly config?: GeneratorConfig) {}

}
