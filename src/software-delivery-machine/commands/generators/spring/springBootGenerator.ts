import { HandleCommand } from "@atomist/automation-client";
import { chainEditors } from "@atomist/automation-client/operations/edit/projectEditorOps";
import { EditorFactory, generatorHandler } from "@atomist/automation-client/operations/generate/generatorToCommand";
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
 * @return {HandleCommand<SpringBootGeneratorParameters>}
 */
export function springBootGenerator(config: JavaGeneratorConfig,
                                    ...additionalActions: Array<EditorFactory<CustomSpringBootGeneratorParameters>>) {
    return generatorHandler<CustomSpringBootGeneratorParameters>(
        (params, ctx) => chainEditors(
            springBootProjectEditor(params),
            updateReadme(params),
            setAtomistTeamInApplicationYml(params, ctx),
            ...additionalActions.map(f => f(params, ctx))),
        () => new CustomSpringBootGeneratorParameters(config),
        "customSpringBootGenerator",
        {
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

/**
 * Sample editor instance
 * @param {CustomSpringBootGeneratorParameters} params
 */
export const sampleEditor: EditorFactory<CustomSpringBootGeneratorParameters> =
    params => async p => {
        /**
         * Add any custom editor code to manipulate project ere
         */
        return p;
    };

function titleBlock(params: CustomSpringBootGeneratorParameters): string {
    return `# ${params.target.repo}
${params.target.description}

Based on seed project \`${params.source.owner}:${params.source.repo}\`

## `;
}
