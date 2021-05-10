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

import * as crypto from "crypto";
import * as stringify from "json-stable-stringify";
import { SdmGoalEvent } from "../../api/goal/SdmGoalEvent";
import { SdmGoalMessage } from "../../api/goal/SdmGoalMessage";
import {
    GoalSigningAlgorithm,
    SigningKey,
    VerificationKey,
} from "../../api/machine/SigningKeys";

/**
 * RSA based GoalSigningAlgorithm
 */
export const RsaGoalSigningAlgorithm: GoalSigningAlgorithm<string> = {

    name: "rsa-sha512",

    sign: async (goal: SdmGoalMessage, key: SigningKey<string>) => {
        const signer = crypto.createSign("RSA-SHA512");
        signer.update(normalizeGoal(goal));
        signer.end();

        const signature = signer.sign({
            key: key.privateKey,
            passphrase: key.passphrase,
        });

        return signature.toString("base64");
    },

    verify: async (goal: SdmGoalEvent, signatureString: string, key: VerificationKey<string>) => {
        const signature = Buffer.from(signatureString, "base64");
        const verifier = crypto.createVerify("RSA-SHA512");
        verifier.update(normalizeGoal(goal));
        verifier.end();
        if (verifier.verify(key.publicKey, signature)) {
            return goal;
        } else {
            return undefined;
        }
    },
};

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
