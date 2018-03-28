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

import { AnyProjectEditor } from "@atomist/automation-client/operations/edit/projectEditor";
import { chainEditors } from "@atomist/automation-client/operations/edit/projectEditorOps";
import { cleanReadMe } from "@atomist/automation-client/operations/generate/UniversalSeed";
import {
    doUpdatePom,
    inferStructureAndMovePackage,
} from "@atomist/spring-automation/commands/generator/java/JavaProjectParameters";
import { inferSpringStructureAndRename } from "@atomist/spring-automation/commands/generator/spring/SpringBootProjectParameters";
import { curry } from "@typed/curry";
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
