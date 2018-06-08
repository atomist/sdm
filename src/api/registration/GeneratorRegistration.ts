/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
