import { inferSpringStructureAndRename, } from "@atomist/spring-automation/commands/generator/spring/SpringBootProjectParameters";
import { AnyProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { curry } from "@typed/curry";
import { cleanReadMe } from "@atomist/automation-client/operations/generate/UniversalSeed";
import {
    doUpdatePom,
    inferStructureAndMovePackage
} from "@atomist/spring-automation/commands/generator/java/JavaProjectParameters";
import { chainEditors } from "@atomist/automation-client/operations/edit/projectEditorOps";
import { SpringProjectCreationParameters } from "./SpringProjectCreationParameters";

/**
 * Transform a seed to a Spring Boot project
 */
export function transformSeedToCustomProject(params: SpringProjectCreationParameters): AnyProjectEditor<any> {
    return chainEditors(
        curry(cleanReadMe)(params.target.description),
        curry(doUpdatePom)(params),
        curry(inferStructureAndMovePackage)(params.rootPackage),
        curry(inferSpringStructureAndRename)(params.serviceClassName),
    );
}
