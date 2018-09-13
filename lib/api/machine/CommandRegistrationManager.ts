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

import { NoParameters } from "@atomist/automation-client/lib/SmartParameters";
import { CodeInspectionRegistration } from "../registration/CodeInspectionRegistration";
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
    addCommand<PARAMS = NoParameters>(command: CommandHandlerRegistration<PARAMS>): this;

    /**
     * Add a generator to this machine to enable project creation
     * @return {this}
     */
    addGeneratorCommand<PARAMS = NoParameters>(generator: GeneratorRegistration<PARAMS>): this;

    /**
     * Add a code transformation to this machine.
     * @return {this}
     */
    addCodeTransformCommand<PARAMS = NoParameters>(ctr: CodeTransformRegistration<PARAMS>): this;

    /**
     * Add a code inspection to this machine.
     * Unlike code transformations, code inspections cannot mutate projects.
     * @return {this}
     */
    addCodeInspectionCommand<R, PARAMS = NoParameters>(cir: CodeInspectionRegistration<R, PARAMS>): this;

}
