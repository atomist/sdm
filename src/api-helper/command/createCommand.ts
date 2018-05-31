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

import { HandleCommand } from "@atomist/automation-client";
import { commandHandlerFrom, OnCommand } from "@atomist/automation-client/onCommand";
import { CommandDetails } from "@atomist/automation-client/operations/CommandDetails";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { EmptyParameters } from "../../api/command/support/EmptyParameters";
import { MachineOrMachineOptions } from "../machine/toMachineOptions";

/**
 * Wrap a function in a command handler, allowing use of custom parameters.
 * Targeting (targets property) is handled automatically if the parameters
 * do not implement TargetsParams
 * @param sdm machine or options
 * @param commandMaker function to create command function
 * @param name command name
 * @param paramsMaker parameters factory, typically the name of a class with a no arg constructor
 * @param details optional details to customize behavior
 * Add intent "edit <name>"
 */
export function createCommand<PARAMS = EmptyParameters>(
    sdm: MachineOrMachineOptions,
    commandMaker: (sdm: MachineOrMachineOptions) => OnCommand<PARAMS>,
    name: string,
    paramsMaker: Maker<PARAMS> = EmptyParameters as Maker<PARAMS>,
    details: Partial<CommandDetails> = {}): HandleCommand<PARAMS> {
    const description = details.description || name;
    const detailsToUse: CommandDetails = {
        description,
        intent: `do ${name}`,
        ...details,
    };

    return commandHandlerFrom(
        commandMaker(sdm),
        paramsMaker,
        name,
        detailsToUse.description,
        detailsToUse.intent,
        detailsToUse.tags);
}
