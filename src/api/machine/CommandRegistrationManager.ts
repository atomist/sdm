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

import { CommandHandlerRegistration } from "../registration/CommandHandlerRegistration";
import { EditorRegistration } from "../registration/EditorRegistration";
import { GeneratorRegistration } from "../registration/GeneratorRegistration";

/**
 * Manage command registrations using a higher level API
 */
export interface CommandRegistrationManager {

    /**
     * Add commands to this machine
     * @return {this}
     */
    addCommands(...commands: CommandHandlerRegistration[]): this;

    /**
     * Add generators to this machine to enable project creation
     * @return {this}
     */
    addGenerators(...gens: Array<GeneratorRegistration<any>>): this;

    /**
     * Add editors to this machine
     * @return {this}
     * @deprecated because in TS 2.9.1 this only works for EditorRegistration<EmptyParameters>
     */
    addEditors(...eds: EditorRegistration[]): this;

    /**
     * Add an editor to this machine
     * @return {this}
     */
    addEditor<P>(ed: EditorRegistration<P>): this;

}
