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

import { Success } from "@atomist/automation-client";
import { OnCommand } from "@atomist/automation-client/onCommand";
import { SoftwareDeliveryMachine } from "../../api/machine/SoftwareDeliveryMachine";
import { CommandHandlerRegistration } from "../../api/registration/CommandHandlerRegistration";
import { commandHandlersWithTag } from "./support/commandSearch";

/**
 * Return a command handler that can create a repo using generators in this SDM
 * @param sdm
 * @return {HandleCommand<EmptyParameters>}
 */
export const CreateRepoHandler: CommandHandlerRegistration = {
    createCommand,
    name: "createRepo",
    description: "Create a repo",
    intent: ["create repo", "new repo"],
};

// TODO implement this with dropdown

function createCommand(sdm: SoftwareDeliveryMachine): OnCommand {
    return async ctx => {
        const generators = commandHandlersWithTag(sdm, "generator");
        await ctx.messageClient.respond(`${generators.length} generators in this SDM`);
        generators.forEach(async hi => {
            await ctx.messageClient.respond(`${hi.instance.intent.map(intent => "`" + intent + "`").join(", ")}`);
        });
        return Success;
    };
}
