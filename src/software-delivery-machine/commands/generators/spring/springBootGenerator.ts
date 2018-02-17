import { HandleCommand } from "@atomist/automation-client";
import { AnyProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { chainEditors } from "@atomist/automation-client/operations/edit/projectEditorOps";
import { generatorHandler } from "@atomist/automation-client/operations/generate/generatorToCommand";
import { ProjectPersister } from "@atomist/automation-client/operations/generate/generatorUtils";
import { GitHubProjectPersister } from "@atomist/automation-client/operations/generate/gitHubProjectPersister";
import { springBootProjectEditor } from "@atomist/spring-automation/commands/generator/spring/springBootGenerator";
import { SpringBootGeneratorParameters } from "@atomist/spring-automation/commands/generator/spring/SpringBootProjectParameters";
import { CustomSpringBootGeneratorParameters } from "./CustomSpringBootGeneratorParameters";

export function springBootGenerator(projectPersister: ProjectPersister = GitHubProjectPersister): HandleCommand<SpringBootGeneratorParameters> {
    return generatorHandler<CustomSpringBootGeneratorParameters>(
        params => chainEditors(springBootProjectEditor(params), editor(params)),
        CustomSpringBootGeneratorParameters,
        "customSpringBootGenerator",
        {
            intent: "create spring",
            tags: ["spring", "boot", "java"],
            projectPersister,
        });
}

export const editor: (params: CustomSpringBootGeneratorParameters) => AnyProjectEditor =
    params => p => {
        console.log("CUSTOM EDIT!");
        return Promise.resolve(p);
    };
