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
import { Parameters } from "@atomist/automation-client/decorators";
import { BaseSeedDrivenGeneratorParameters } from "@atomist/automation-client/operations/generate/BaseSeedDrivenGeneratorParameters";
import { SmartParameters } from "@atomist/automation-client/SmartParameters";
import { VersionedArtifact } from "@atomist/spring-automation/commands/generator/java/JavaProjectParameters";
import { SemVerRegExp } from "../../../../common/command/commonPatterns";
import { JavaPackageRegExp, MavenArtifactIdRegExp, MavenGroupIdRegExp } from "../../../../common/command/javaPatterns";

/**
 * Superclass for all Java project generator parameters.
 */
@Parameters()
export class JavaProjectCreationParameters extends BaseSeedDrivenGeneratorParameters
    implements SmartParameters, VersionedArtifact {

    @Parameter({
        ...MavenArtifactIdRegExp,
        required: false,
        order: 51,
    })
    public artifactId: string = "";

    @Parameter({
        ...MavenGroupIdRegExp,
        required: true,
        order: 50,
    })
    public groupId: string;

    @Parameter({
        ...SemVerRegExp,
        required: true,
        order: 52,
    })
    public version: string = "0.1.0-SNAPSHOT";

    @Parameter({
        ...JavaPackageRegExp,
        required: true,
        order: 53,
    })
    public rootPackage: string;

    @MappedParameter(MappedParameters.SlackTeam)
    public slackTeam: string;

    get description() {
        return this.target.description;
    }

    public bindAndValidate() {
        if (!this.artifactId) {
            this.artifactId = this.target.repo;
        }
    }

}
