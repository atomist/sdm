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

import { GraphClientListener } from "@atomist/automation-client/lib/graph/ApolloGraphClient";
import {
    AutomationContextAware,
    HandlerContext,
} from "@atomist/automation-client/lib/HandlerContext";
import { logger } from "@atomist/automation-client/lib/util/logger";
import * as fs from "fs-extra";
import * as stringify from "json-stable-stringify";
import * as path from "path";
import { DeepPartial } from "ts-essentials";
import { updateGoal } from "../../api-helper/goal/storeGoals";
import { SdmGoalEvent } from "../../api/goal/SdmGoalEvent";
import { SdmGoalMessage } from "../../api/goal/SdmGoalMessage";
import {
    GoalSigningAlgorithm,
    GoalSigningConfiguration,
    GoalSigningKey,
    GoalSigningScope,
    GoalVerificationKey,
} from "../../api/machine/SigningKeys";
import { SdmGoalState } from "../../typings/types";
import { toArray } from "../util/misc/array";
import { RsaGoalSigningAlgorithm } from "./rsaGoalSigning";

export interface SignatureMixin {
    signature: string;
}

export const DefaultGoalSigningAlgorithm = RsaGoalSigningAlgorithm;

/**
 * AutomationEventListener that verifies incoming SDM goals against a set of configurable
 * verification public keys.
 *
 * Optionally a private key can be specified to sign outgoing goals. Setting this is strongly
 * recommended to prevent executing untrusted and/or tampered SDM goals.
 */
export class GoalSigningAutomationEventListener implements GraphClientListener {

    constructor(private readonly gsc: GoalSigningConfiguration) {
        this.initVerificationKeys();
    }

    public operationStarting(operation: any): any {

        if (operation.operationName === "UpdateSdmGoal") {
            const goal = operation.variables?.goal;
            if (!!goal) {
                operation.variables.goal = signGoal(goal as SdmGoalMessage & SignatureMixin, this.gsc);
            }
        }

        return operation;
    }

    private initVerificationKeys(): void {
        this.gsc.verificationKeys = toArray(this.gsc.verificationKeys) || [];

        // If signing key is set, also use it to verify
        if (!!this.gsc.signingKey) {
            this.gsc.verificationKeys.push(this.gsc.signingKey);
        }

        // Load the Atomist public key
        const publicKey = fs.readFileSync(path.join(__dirname, "atomist-public.pem")).toString();
        this.gsc.verificationKeys.push({ publicKey, name: "atomist.com/sdm" });
    }
}

/**
 * Verify a goal signature against the public keys configured in provided Configuration.
 * If signature can't be verified, the goal will be marked as failed and an Error will be thrown.
 * @param goal goal to verify
 * @param gsc signing configuration
 * @param ctx
 */
export async function verifyGoal(goal: SdmGoalEvent & DeepPartial<SignatureMixin>,
                                 gsc: GoalSigningConfiguration,
                                 ctx: HandlerContext): Promise<void> {
    if (!!gsc && gsc.enabled === true && !!goal && isInScope(gsc.scope, ctx) && !isGoalRejected(goal)) {
        if (!!goal.signature) {

            const message = normalizeGoal(goal);

            let verifiedWith: GoalVerificationKey<any>;
            for (const key of toArray(gsc.verificationKeys)) {
                if (findAlgorithm(key, gsc).verify(message, goal.signature, key)) {
                    verifiedWith = key;
                    break;
                }
            }

            if (!!verifiedWith) {
                logger.debug(
                    `Verified signature for incoming goal '${goal.uniqueName}' of '${goal.goalSetId}' with key '${
                    verifiedWith.name}' and algorithm '${verifiedWith.algorithm || DefaultGoalSigningAlgorithm.name}'`);
            } else {
                await rejectGoal("signature invalid", goal, ctx);
                throw new Error("SDM goal signature invalid. Rejecting goal!");
            }

        } else {
            await rejectGoal("signature missing", goal, ctx);
            throw new Error("SDM goal signature is missing. Rejecting goal!");
        }
    }
}

/**
 * Add a signature to a goal
 * @param goal
 * @param gsc
 */
export function signGoal(goal: SdmGoalMessage,
                         gsc: GoalSigningConfiguration): SdmGoalMessage & SignatureMixin {
    if (!!gsc && gsc.enabled === true && !!gsc.signingKey) {
        (goal as any).signature = findAlgorithm(gsc.signingKey, gsc).sign(normalizeGoal(goal), gsc.signingKey);
        logger.debug(`Signed goal '${goal.uniqueName}' of '${goal.goalSetId}'`);
        return goal as any;
    } else {
        return goal as any;
    }
}

async function rejectGoal(reason: string,
                          sdmGoal: SdmGoalEvent,
                          ctx: HandlerContext): Promise<void> {
    await updateGoal(
        ctx,
        sdmGoal,
        {
            state: SdmGoalState.failure,
            description: `Rejected: ${sdmGoal.name}`,
            phase: reason,
        });
}

function findAlgorithm(key: GoalVerificationKey<any> | GoalSigningKey<any>,
                       gsc: GoalSigningConfiguration): GoalSigningAlgorithm<any> {
    const algorithm = [...toArray(gsc.algorithms || []), DefaultGoalSigningAlgorithm]
        .find(a => a.name.toLowerCase() === (key.algorithm || DefaultGoalSigningAlgorithm.name).toLowerCase());
    if (!algorithm) {
        throw new Error(
            `Goal signing or verification key '${key.name}' requested algorithm '${key.algorithm}' which isn't configured`);
    }
    return algorithm;
}

function isInScope(scope: GoalSigningScope, ctx: HandlerContext): boolean {
    if (scope === GoalSigningScope.All) {
        return true;
    } else if (scope === GoalSigningScope.Fulfillment &&
        (ctx as any as AutomationContextAware).context.operation === "FulfillGoalOnRequested") {
        return true;
    } else {
        return false;
    }
}

function isGoalRejected(sdmGoal: SdmGoalEvent): boolean {
    return sdmGoal.state === SdmGoalState.failure && sdmGoal.description === `Rejected: ${sdmGoal.name}`;
}

export function normalizeGoal(goal: SdmGoalMessage | SdmGoalEvent): string {
    // Create a new goal with only the relevant and sensible fields
    const newGoal: Omit<SdmGoalEvent, "push"> & { parameters: string } = {
        uniqueName: normalizeValue(goal.uniqueName),
        name: normalizeValue(goal.name),
        environment: normalizeValue(goal.environment),
        repo: {
            owner: normalizeValue(goal.repo.owner),
            name: normalizeValue(goal.repo.name),
            providerId: normalizeValue(goal.repo.providerId),
        },
        goalSet: normalizeValue(goal.goalSet),
        registration: normalizeValue(goal.registration),
        goalSetId: normalizeValue(goal.goalSetId),
        externalKey: normalizeValue(goal.externalKey),
        sha: normalizeValue(goal.sha),
        branch: normalizeValue(goal.branch),
        state: normalizeValue(goal.state),
        phase: normalizeValue(goal.phase),
        version: normalizeValue(goal.version),
        description: normalizeValue(goal.description),
        descriptions: !!goal.descriptions ? {
            planned: normalizeValue(goal.descriptions.planned),
            requested: normalizeValue(goal.descriptions.requested),
            inProcess: normalizeValue(goal.descriptions.inProcess),
            completed: normalizeValue(goal.descriptions.completed),
            failed: normalizeValue(goal.descriptions.failed),
            skipped: normalizeValue(goal.descriptions.skipped),
            canceled: normalizeValue(goal.descriptions.canceled),
            stopped: normalizeValue(goal.descriptions.stopped),
            waitingForApproval: normalizeValue(goal.descriptions.waitingForApproval),
            waitingForPreApproval: normalizeValue(goal.descriptions.waitingForPreApproval),
        } : undefined,
        ts: normalizeValue(goal.ts),
        data: normalizeValue(goal.data),
        parameters: normalizeValue((goal as any).parameters),
        url: normalizeValue(goal.url),
        externalUrls: !!goal.externalUrls ? goal.externalUrls.map(e => ({
            url: normalizeValue(e.url),
            label: normalizeValue(e.label),
        })) : [],
        preApprovalRequired: normalizeValue(goal.preApprovalRequired),
        preApproval: !!goal.preApproval ? {
            channelId: normalizeValue(goal.preApproval.channelId),
            correlationId: normalizeValue(goal.preApproval.correlationId),
            name: normalizeValue(goal.preApproval.name),
            registration: normalizeValue(goal.preApproval.registration),
            ts: normalizeValue(goal.preApproval.ts),
            userId: normalizeValue(goal.preApproval.userId),
            version: normalizeValue(goal.preApproval.version),
        } : undefined,
        approvalRequired: normalizeValue(goal.approvalRequired),
        approval: !!goal.approval ? {
            channelId: normalizeValue(goal.approval.channelId),
            correlationId: normalizeValue(goal.approval.correlationId),
            name: normalizeValue(goal.approval.name),
            registration: normalizeValue(goal.approval.registration),
            ts: normalizeValue(goal.approval.ts),
            userId: normalizeValue(goal.approval.userId),
            version: normalizeValue(goal.approval.version),
        } : undefined,
        retryFeasible: normalizeValue(goal.retryFeasible),
        error: normalizeValue(goal.error),
        preConditions: !!goal.preConditions ? goal.preConditions.map(c => ({
            environment: normalizeValue(c.environment),
            name: normalizeValue(c.name),
            uniqueName: normalizeValue(c.uniqueName),
        })) : [],
        fulfillment: !!goal.fulfillment ? {
            method: normalizeValue(goal.fulfillment.method),
            registration: normalizeValue(goal.fulfillment.registration),
            name: normalizeValue(goal.fulfillment.name),
        } : undefined,
        provenance: !!goal.provenance ? goal.provenance.map(p => ({
            channelId: normalizeValue(p.channelId),
            correlationId: normalizeValue(p.correlationId),
            name: normalizeValue(p.name),
            registration: normalizeValue(p.registration),
            ts: normalizeValue(p.ts),
            userId: normalizeValue(p.userId),
            version: normalizeValue(p.version),
        })) : [],
    };
    return stringify(newGoal);
}

function normalizeValue(value: any): any {
    if (value !== undefined && value !== null) {
        return value;
    } else {
        return undefined;
    }
}
