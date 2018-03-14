import { HandleCommand } from "@atomist/automation-client";
import { chainEditors } from "@atomist/automation-client/operations/edit/projectEditorOps";
import {
    EditorFactory, GeneratorCommandDetails,
    generatorHandler,
} from "@atomist/automation-client/operations/generate/generatorToCommand";
import * as utils from "@atomist/automation-client/project/util/projectUtils";

import { springBootProjectEditor } from "@atomist/spring-automation/commands/generator/spring/springBootGenerator";
import { SpringBootGeneratorParameters } from "@atomist/spring-automation/commands/generator/spring/SpringBootProjectParameters";
import { CustomSpringBootGeneratorParameters } from "./CustomSpringBootGeneratorParameters";
import { JavaGeneratorConfig } from "./JavaGeneratorConfig";

/**
 * Function to create a Spring Boot generator.
 * Relies on generic Atomist Java & Spring functionality in spring-automations
 * @param config config for a Java generator, including location of seed
 * @param additionalActions zero or more additional editor actions
 * @param details allow customization
 * @return {HandleCommand<SpringBootGeneratorParameters>}
 */
export function springBootGenerator(config: JavaGeneratorConfig,
                                    additionalActions: Array<EditorFactory<CustomSpringBootGeneratorParameters>>,
                                    details: Partial<GeneratorCommandDetails<CustomSpringBootGeneratorParameters>> = {}) {
    return generatorHandler<CustomSpringBootGeneratorParameters>(
        (params, ctx) => chainEditors(
            updateReadme(params),
            setAtomistTeamInApplicationYml(params, ctx),
            springBootProjectEditor(params),
            ...additionalActions.map(f => f(params, ctx)),
        ),
        () => new CustomSpringBootGeneratorParameters(config),
        "customSpringBootGenerator",
        {
            ...details,
            intent: "create spring",
            tags: ["spring", "boot", "java"],
        });
}

/**
 * Update the readme
 * @param {CustomSpringBootGeneratorParameters} params
 */
export const updateReadme =
    (params: CustomSpringBootGeneratorParameters) => async p => {
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

function titleBlock(params: CustomSpringBootGeneratorParameters): string {
    return `# ${params.target.repo}
${params.target.description}

Based on seed project \`${params.source.owner}:${params.source.repo}\`

## `;
}
