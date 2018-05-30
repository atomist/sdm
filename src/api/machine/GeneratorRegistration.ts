import { AnyProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { GeneratorCommandDetails } from "@atomist/automation-client/operations/generate/generatorToCommand";
import { SeedDrivenGeneratorParameters } from "@atomist/automation-client/operations/generate/SeedDrivenGeneratorParameters";
import { Maker } from "@atomist/automation-client/util/constructionUtils";

export interface GeneratorRegistration<PARAMS extends SeedDrivenGeneratorParameters> extends Partial<GeneratorCommandDetails<PARAMS>> {

    name: string;

    editor: (params: PARAMS) => AnyProjectEditor;

    paramsMaker: Maker<PARAMS>;

}
