/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { MappedParameter, MappedParameters, Parameter } from "@atomist/automation-client";
import { BaseSeedDrivenGeneratorParameters } from "@atomist/automation-client/operations/generate/BaseSeedDrivenGeneratorParameters";

import { Parameters } from "@atomist/automation-client/decorators";
import { SemVerRegExp } from "../../../../common/command/commonPatterns";
import { GeneratorConfig } from "../../../../common/command/generator/GeneratorConfig";

/**
 * Parameters for creating a Node project.
 */
@Parameters()
export class NodeProjectCreationParameters extends BaseSeedDrivenGeneratorParameters {

    @MappedParameter(MappedParameters.SlackUserName)
    public screenName: string;

    @Parameter({
        displayName: "App name",
        description: "Application name",
        pattern: /^(@?[A-Za-z][-A-Za-z0-9_]*)$/,
        validInput: "a valid package.json application name, which starts with a lower-case letter and contains only " +
        " alphanumeric, -, and _ characters, or `${projectName}` to use the project name",
        minLength: 1,
        maxLength: 50,
        required: true,
        order: 51,
    })
    public appName: string;

    @Parameter({
        displayName: "Version",
        ...SemVerRegExp,
        required: true,
        order: 52,
    })
    public version: string = "0.1.0";

    constructor(config: GeneratorConfig) {
        super();
        this.source.owner = config.seedOwner;
        this.source.repo = config.seedRepo;
        this.addAtomistWebhook = config.addAtomistWebhook;
    }
}
