/*
 * Copyright © 2020 Atomist, Inc.
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

import { Success } from "@atomist/automation-client/lib/HandlerResult";
import { NoParameters } from "@atomist/automation-client/lib/SmartParameters";
import { CommandListener } from "../../../api/listener/CommandListener";
import { SoftwareDeliveryMachine } from "../../../api/machine/SoftwareDeliveryMachine";
import { CommandHandlerRegistration } from "../../../api/registration/CommandHandlerRegistration";
import { commandHandlersWithTag } from "./support/commandSearch";

/**
 * Return a command handler that can list generators in the current SDM.
 * Will not identify generators in other projects.
 * @param {SoftwareDeliveryMachine} sdm
 * @return {HandleCommand<EmptyParameters>}
 */
export function listGeneratorsHandler(sdm: SoftwareDeliveryMachine): CommandHandlerRegistration {
    return {
        listener: createListener(sdm),
        name: "listGenerators",
        description: "List generators",
        intent: [ "list generators", "show generators" ],
    };
}

function createListener(sdm: SoftwareDeliveryMachine): CommandListener<NoParameters> {
    return async cli => {
        const generators = commandHandlersWithTag(sdm, "generator");
        let message = `${generators.length} generators in this software delivery machine\n`;
        generators.forEach(async hi => {
            message += `${hi.instance.intent.map(intent => "`" + intent + "`").join(", ")}\n`;
        });
        await cli.context.messageClient.respond(message);
        return Success;
    };
}
