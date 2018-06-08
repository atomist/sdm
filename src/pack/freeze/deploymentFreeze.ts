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

import { logger } from "@atomist/automation-client";
import { allOf } from "../../api/dsl/allOf";
import { MessageGoal } from "../../api/goal/common/MessageGoal";
import { executeSendMessageToSlack } from "../../api/goal/support/executeSendMessageToSlack";
import { PushListenerInvocation } from "../../api/listener/PushListener";
import { ExtensionPack } from "../../api/machine/ExtensionPack";
import { PushTest } from "../../api/mapping/PushTest";
import { CommandHandlerRegistration } from "../../api/registration/CommandHandlerRegistration";

/**
 * Goal to explain a deployment freeze to the user.
 * Available after adding deploymentFreeze capability.
 * @type {MessageGoal}
 */
export const ExplainDeploymentFreezeGoal = new MessageGoal("deploymentFreeze");

/**
 * Implemented by objects that know how to persist deployment freeze status.
 */
export interface DeploymentStatusManager {

    setFrozen(flag: boolean);

    isFrozen: Promise<boolean>;
}

/**
 * Capability to add to an SDM to add deployment freeze.
 * Makes the ExplainDeploymentFreezeGoal available.
 * @param {DeploymentStatusManager} dsm
 * @return {ExtensionPack}
 */
export function deploymentFreeze(dsm: DeploymentStatusManager): ExtensionPack {
    return {
        name: "deploymentFreeze",
        vendor: "Atomist",
        version: "0.1.0",
        configure: sdm => {
            sdm.addCommands(
                freezeCommand(dsm),
                unfreezeCommand(dsm),
            );
            sdm.addGoalImplementation("ExplainDeploymentFreezeGoal",
                ExplainDeploymentFreezeGoal,
                executeSendMessageToSlack("*Attention*: Not deploying as deployment is currently frozen :no_entry:"));
        },
    };
}

/**
 * Return a push test working against the current DeploymentStatusManager.
 * Use in SDMs that have enabled deploymentFreeze capability.
 * @param {DeploymentStatusManager} dsm
 * @return {PushTest}
 */
export function isDeploymentFrozen(dsm: DeploymentStatusManager): PushTest {
    return allOf<PushListenerInvocation>(async pu => {
        logger.info(`Delivery is frozen for '${pu.push.after.message}' = ${dsm.isFrozen}`);
        return dsm.isFrozen;
    });
}

function freezeCommand(dsm: DeploymentStatusManager): CommandHandlerRegistration {
    return {
        listener: async cli => {
            dsm.setFrozen(true);
            return cli.addressChannels("Deployment is frozen for all services :no_entry:");
        },
        name: "freeze",
        description: "Freeze deployment",
        intent: "freeze deployment",
    };
}

function unfreezeCommand(dsm: DeploymentStatusManager): CommandHandlerRegistration {
    return {
        listener: async cli => {
            dsm.setFrozen(false);
            return cli.addressChannels("Deployment is re-enabled for all services :woman-running:");
        },
        name: "unfreeze",
        description: "Unfreeze deployment",
        intent: "unfreeze deployment",
    };
}
