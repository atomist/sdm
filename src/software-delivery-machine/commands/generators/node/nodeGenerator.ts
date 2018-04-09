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

import { HandleCommand, HandlerContext } from "@atomist/automation-client";
import { AnyProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { chainEditors } from "@atomist/automation-client/operations/edit/projectEditorOps";
import {
    GeneratorCommandDetails,
    generatorHandler,
} from "@atomist/automation-client/operations/generate/generatorToCommand";
import { GeneratorConfig } from "../../../../common/command/generator/GeneratorConfig";
import { updatePackageJsonIdentification } from "../../editors/node/updatePackageJsonIdentification";
import { updateReadmeTitle } from "../../editors/updateReadmeTitle";
import { NodeProjectCreationParameters } from "./NodeProjectCreationParameters";

export function nodeGenerator(config: GeneratorConfig,
                              details: Partial<GeneratorCommandDetails<NodeProjectCreationParameters>> = {}): HandleCommand {
    return generatorHandler<NodeProjectCreationParameters>(
        transformSeed,
        () => new NodeProjectCreationParameters(config),
        `nodeGenerator-${config.seedRepo}`,
        {
            tags: ["node", "typescript", "generator"],
            ...details,
            intent: config.intent,
        });
}

function transformSeed(params: NodeProjectCreationParameters, ctx: HandlerContext): AnyProjectEditor<NodeProjectCreationParameters> {
    return chainEditors(
        updatePackageJsonIdentification(params.appName, params.target.description,
            params.version,
            params.screenName,
            params.target),
        updateReadmeTitle(params.appName, params.target.description),
    );
}
