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

import { SeedDrivenGeneratorParameters } from "@atomist/automation-client/operations/generate/SeedDrivenGeneratorParameters";
import { CodeTransformRegistration } from "../registration/CodeTransformRegistration";
import { CommandHandlerRegistration } from "../registration/CommandHandlerRegistration";
import { GeneratorRegistration } from "../registration/GeneratorRegistration";

/**
 * Manage command registrations.
 */
export interface CommandRegistrationManager {

    /**
     * Add a generic command to this machine
     * @return {this}
     */
    addCommand<PARAMS>(command: CommandHandlerRegistration<PARAMS>): this;

    /**
     * Add a generator to this machine to enable project creation
     * @return {this}
     */
    addGeneratorCommand<PARAMS extends SeedDrivenGeneratorParameters>(generator: GeneratorRegistration<PARAMS>): this;

    /**
     * @deprecated use addGeneratorCommand
     * @param {GeneratorRegistration<PARAMS extends SeedDrivenGeneratorParameters>} generator
     * @return {this}
     */
    addGenerator<PARAMS extends SeedDrivenGeneratorParameters>(generator: GeneratorRegistration<PARAMS>): this;

    /**
     * Add a code transformation to this machine
     * @return {this}
     */
    addCodeTransformCommand<PARAMS>(ed: CodeTransformRegistration<PARAMS>): this;

    /**
     * @deprecated use add CodeTransformCommand
     * @return {this}
     */
    addEditor<PARAMS>(ed: CodeTransformRegistration<PARAMS>): this;
}
