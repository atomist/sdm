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

import { Parameter } from "@atomist/automation-client";
import { camelize } from "tslint/lib/utils";
import { JavaGeneratorConfig } from "../JavaGeneratorConfig";
import { JavaProjectCreationParameters } from "../JavaProjectCreationParameters";

/**
 * Parameters for creating Spring Boot apps.
 * Customize spring-automations default parameters to default our group
 * and choose our seed
 */
export class SpringProjectCreationParameters extends JavaProjectCreationParameters {

    @Parameter({
        displayName: "Maven Group ID",
        description: "Maven group identifier, often used to provide a namespace for your project," +
        " e.g., com.pany.team",
        pattern: /^.*$/,
        validInput: "a valid Maven group ID, which starts with a letter, -, or _ and contains only" +
        " alphanumeric, -, and _ characters and may having leading period separated identifiers starting" +
        " with letters or underscores and containing only alphanumeric and _ characters.",
        minLength: 1,
        maxLength: 50,
        required: false,
        order: 50,
    })
    public groupId: string = "myco";

    @Parameter({
        displayName: "Class Name",
        description: "name for the service class",
        pattern: /^.*$/,
        validInput: "a valid Java class name, which contains only alphanumeric characters, $ and _" +
        " and does not start with a number",
        minLength: 1,
        maxLength: 50,
        required: false,
    })
    public serviceClassName: string;

    @Parameter({
        displayName: "Seed repo",
        description: "Seed repo",
        pattern: /^.*$/,
        validInput: "a GitHub repo in this org",
        minLength: 1,
        maxLength: 50,
        required: false,
    })
    public seed: string = "spring-rest-seed";

    constructor(params: JavaGeneratorConfig) {
        super();
        this.source.owner = params.seedOwner;
        this.seed = params.seedRepo;
        this.groupId = params.groupId;
    }

    public bindAndValidate() {
        super.bindAndValidate();
        this.source.repo = this.seed;
        this.serviceClassName = !!this.serviceClassName ?
            toInitialCap(this.serviceClassName) :
            toInitialCap(camelize(this.artifactId));
    }

}

function toInitialCap(s: string) {
    return s.charAt(0).toUpperCase() + s.substr(1);
}
