import { HandleCommand } from "@atomist/automation-client";
import { AnyProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { chainEditors } from "@atomist/automation-client/operations/edit/projectEditorOps";
import { generatorHandler } from "@atomist/automation-client/operations/generate/generatorToCommand";
import { ProjectPersister } from "@atomist/automation-client/operations/generate/generatorUtils";
import { GitHubProjectPersister } from "@atomist/automation-client/operations/generate/gitHubProjectPersister";
import { springBootProjectEditor } from "@atomist/spring-automation/commands/generator/spring/springBootGenerator";
import { SpringBootGeneratorParameters } from "@atomist/spring-automation/commands/generator/spring/SpringBootProjectParameters";
import { CustomSpringBootGeneratorParameters } from "./CustomSpringBootGeneratorParameters";
import { JavaGeneratorConfig } from "./JavaGeneratorConfig";

/**
 * Spring Boot generator. Relies on generic Atomist Java & Spring functionality in spring-automations
 * @param config config for a Java generator, including location of seed
 * @param {ProjectPersister} projectPersister
 * @return {HandleCommand<SpringBootGeneratorParameters>}
 */
export function springBootGenerator(config: JavaGeneratorConfig,
                                    projectPersister: ProjectPersister = GitHubProjectPersister): HandleCommand<SpringBootGeneratorParameters> {
    return generatorHandler<CustomSpringBootGeneratorParameters>(
        params => chainEditors(springBootProjectEditor(params), editor(params)),
        () => new CustomSpringBootGeneratorParameters(config),
        "customSpringBootGenerator",
        {
            intent: "create spring",
            tags: ["spring", "boot", "java"],
            projectPersister,
        });
}

export const editor: (params: CustomSpringBootGeneratorParameters) => AnyProjectEditor =
    params => p => {
        /**
         * Add any custom editor code here
         */
        return Promise.resolve(p);
    };
