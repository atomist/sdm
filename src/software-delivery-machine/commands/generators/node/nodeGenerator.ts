import { HandleCommand, HandlerContext } from "@atomist/automation-client";
import { AnyProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { chainEditors } from "@atomist/automation-client/operations/edit/projectEditorOps";
import {
    GeneratorCommandDetails,
    generatorHandler,
} from "@atomist/automation-client/operations/generate/generatorToCommand";
import { updatePackageJsonIdentification } from "../../editors/node/updatePackageJsonIdentification";
import { updateReadmeTitle } from "../../editors/updateReadmeTitle";
import { GeneratorConfig } from "../GeneratorConfig";
import { NodeGeneratorParameters } from "./NodeGeneratorParameters";

export function nodeGenerator(config: GeneratorConfig,
                              details: Partial<GeneratorCommandDetails<NodeGeneratorParameters>> = {}): HandleCommand {
    return generatorHandler<NodeGeneratorParameters>(
        transformSeed,
        () => new NodeGeneratorParameters(config),
        "nodeGenerator",
        {
            tags: ["node", "typescript"],
            ...details,
            intent: config.intent,
        });
}

function transformSeed(params: NodeGeneratorParameters, ctx: HandlerContext): AnyProjectEditor<NodeGeneratorParameters> {
    return chainEditors(
        updatePackageJsonIdentification(params.appName, params.target.description,
            params.version,
            params.screenName,
            params.target),
        updateReadmeTitle(params.appName, params.target.description),
    );
}
