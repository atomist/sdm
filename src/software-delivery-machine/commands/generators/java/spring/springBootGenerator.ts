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

import { chainEditors } from "@atomist/automation-client/operations/edit/projectEditorOps";
import {
    GeneratorCommandDetails,
    generatorHandler,
} from "@atomist/automation-client/operations/generate/generatorToCommand";
import * as utils from "@atomist/automation-client/project/util/projectUtils";

import { HandleCommand } from "@atomist/automation-client";
import { JavaGeneratorConfig } from "../JavaGeneratorConfig";
import { SpringProjectCreationParameters } from "./SpringProjectCreationParameters";
import { transformSeedToCustomProject } from "./transformSeedToCustomProject";

/**
 * Function to create a Spring Boot generator.
 * Relies on generic Atomist Java & Spring functionality in spring-automations
 * @param config config for a Java generator, including location of seed
 * @param details allow customization
 * @return {HandleCommand<SpringProjectCreationParameters>}
 */
export function springBootGenerator(config: JavaGeneratorConfig,
                                    // tslint:disable-next-line:max-line-length
                                    details: Partial<GeneratorCommandDetails<SpringProjectCreationParameters>> = {}): HandleCommand<SpringProjectCreationParameters> {
    return generatorHandler<SpringProjectCreationParameters>(
        (params, ctx) => chainEditors(
            replaceReadmeTitle(params),
            setAtomistTeamInApplicationYml(params, ctx),
            transformSeedToCustomProject(params),
        ),
        () => new SpringProjectCreationParameters(config),
        `springBootGenerator-${config.seedRepo}`,
        {
            tags: ["spring", "boot", "java", "generator"],
            ...details,
            intent: config.intent,
        });
}

/**
 * Update the readme
 */
export const replaceReadmeTitle =
    (params: SpringProjectCreationParameters) => async p => {
        return utils.doWithFiles(p, "README.md", readMe => {
            readMe.recordReplace(/^#[\s\S]*?## /, titleBlock(params));
        });
    };

/**
 * Replace the ${ATOMIST_TEAM} placeholder in the seed with the id
 * of the team we are generating for
 * @param params
 * @param ctx
 */
export const setAtomistTeamInApplicationYml =
    (params, ctx) => async p => {
        return utils.doWithFiles(p, "src/main/resources/application.yml", f =>
            f.replace(/\${ATOMIST_TEAM}/, ctx.teamId));
    };

function titleBlock(params: SpringProjectCreationParameters): string {
    return `# ${params.target.repo}
${params.target.description}

Based on seed project \`${params.source.owner}:${params.source.repo}\`

## `;
}
