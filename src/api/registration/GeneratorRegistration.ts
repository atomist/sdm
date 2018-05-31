import { GeneratorCommandDetails } from "@atomist/automation-client/operations/generate/generatorToCommand";
import { SeedDrivenGeneratorParameters } from "@atomist/automation-client/operations/generate/SeedDrivenGeneratorParameters";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { ProjectOperationRegistration } from "./ProjectOperationRegistration";

/**
 * Register a project creation operation
 */
export interface GeneratorRegistration<PARAMS extends SeedDrivenGeneratorParameters> extends Partial<GeneratorCommandDetails<PARAMS>>,
    ProjectOperationRegistration<PARAMS> {

    /**
     * Create the parameters required by this generator
     */
    paramsMaker: Maker<PARAMS>;

}
