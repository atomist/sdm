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

import { HandleCommand } from "@atomist/automation-client";
import { commandHandlerFrom, OnCommand } from "@atomist/automation-client/onCommand";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import { SoftwareDeliveryMachine } from "../../blueprint/SoftwareDeliveryMachine";
import { EmptyParameters } from "../../common/command/EmptyParameters";

export const SelfDescribeCommandName = "SelfDescribe";

/**
 * Return a command handler that can describe the present software delivery machine
 * @param {SoftwareDeliveryMachine} sdm
 * @return {HandleCommand<EmptyParameters>}
 */
export function selfDescribeHandler(sdm: SoftwareDeliveryMachine): Maker<HandleCommand> {
    return () => commandHandlerFrom(
        handleDescribe(sdm),
        EmptyParameters,
        SelfDescribeCommandName,
        "Describe this SDM",
        "describe sdm");
}

function handleDescribe(sdm: SoftwareDeliveryMachine): OnCommand {
    return async ctx => {
        const message = `I am a brilliant SDM, eager to work for you.\nMy name is _${sdm.name}_`;
        await ctx.messageClient.respond(message);
        return { code: 0, message };
    };
}
