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
    GitHubNameRegExp,
    GitHubRepoCreationParameters,
    NewRepoCreationParameters,
    RemoteLocator,
    SeedDrivenGeneratorParameters,
} from "@atomist/automation-client";
import {
    MappedParameter,
    MappedParameters,
    Parameter,
    Parameters,
} from "@atomist/automation-client/lib/decorators";
import { SemVerRegExp } from "../support/commonValidationPatterns";
import { GeneratorConfig } from "./GeneratorConfig";

/**
 * Convenient base class for project generator parameters.
 */
@Parameters()
export class SeedDrivenGeneratorParametersSupport implements SeedDrivenGeneratorParameters {

    @MappedParameter(MappedParameters.SlackUserName)
    public screenName: string;

    @Parameter({
        pattern: /^(?:true|false)$/,
        type: "boolean",
        displayName: "Add Atomist webhook",
        description: "whether to add the Atomist webhook to the repository to allow updates",
        validInput: "'true' or 'false'",
        required: false,
        displayable: true,
    })
    public addAtomistWebhook: boolean = false;

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

    get description() {
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

    public constructor(private readonly config?: GeneratorConfig) {
        if (!!config && config.addAtomistWebhook !== undefined) {
            this.addAtomistWebhook = config.addAtomistWebhook;
        }
    }

}
