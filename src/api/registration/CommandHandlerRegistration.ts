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

import { OnCommand } from "@atomist/automation-client/onCommand";
import { MachineOrMachineOptions } from "../../api-helper/machine/toMachineOptions";
import { CommandListener } from "../listener/CommandListener";
import { CommandRegistration } from "./CommandRegistration";

/**
 * Type for registering a project edit, which can encapsulate changes
 * to projects. One of listener or createCommand function must be provided.
 */
export interface CommandHandlerRegistration<PARAMS = any> extends CommandRegistration<PARAMS> {

    /**
     * Create the command function
     * @return {AnyProjectEditor}
     */
    createCommand?: (sdm: MachineOrMachineOptions) => OnCommand<PARAMS>;

    listener?: CommandListener<PARAMS>;

}
