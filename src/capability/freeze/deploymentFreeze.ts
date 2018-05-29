import { logger } from "@atomist/automation-client";
import { commandHandlerFrom } from "@atomist/automation-client/onCommand";
import { allOf } from "../../blueprint/dsl/allOf";
import { ExtensionPack } from "../../blueprint/ExtensionPack";
import { EmptyParameters } from "../../common/command/EmptyParameters";
import { MessageGoal } from "../../common/delivery/goals/common/MessageGoal";
import { PushListenerInvocation } from "../../common/listener/PushListener";
import { PushTest } from "../../common/listener/PushTest";
import { executeSendMessageToSlack } from "../../common/slack/executeSendMessageToSlack";

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
        configure: sdm => {
            sdm.addSupportingCommands(
                () => freezeCommand(dsm),
                () => unfreezeCommand(dsm),
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

function freezeCommand(dsm: DeploymentStatusManager) {
    return commandHandlerFrom(
        async ctx => {
            dsm.setFrozen(true);
            return ctx.messageClient.respond("Deployment is frozen for all services :no_entry:");
        },
        EmptyParameters,
        "freeze",
        "Freeze deployment",
        "freeze deployment",
    );
}

function unfreezeCommand(freezeStore: DeploymentStatusManager) {
    return commandHandlerFrom(
        async ctx => {
            freezeStore.setFrozen(false);
            return ctx.messageClient.respond("Deployment is re-enabled for all services :woman-running:");
        },
        EmptyParameters,
        "unfreeze",
        "Unfreeze deployment",
        "unfreeze deployment",
    );
}
