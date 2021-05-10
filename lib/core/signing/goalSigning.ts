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
import { MutationOptions } from "@atomist/automation-client/src/lib/spi/graph/GraphClient";
import * as fs from "fs-extra";
import * as path from "path";
import { DeepPartial } from "ts-essentials";
import { updateGoal } from "../../api-helper/goal/storeGoals";
import { SdmGoalEvent } from "../../api/goal/SdmGoalEvent";
import { SdmGoalMessage } from "../../api/goal/SdmGoalMessage";
import {
	GoalSigningAlgorithm,
	GoalSigningConfiguration,
	SigningKey,
	GoalSigningScope,
	VerificationKey,
} from "../../api/machine/SigningKeys";
import { SdmGoalState } from "../../typings/types";
import { toArray } from "../util/misc/array";
import { JwtGoalSigningAlgorithm } from "./jwtGoalSigning";
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
export class GoalSigningAutomationEventListener implements GraphClientListener<{ goal: SdmGoalMessage }> {

	constructor(private readonly gsc: GoalSigningConfiguration) {
		this.initVerificationKeys();
	}

	public async onMutation(options: MutationOptions<{ goal: SdmGoalMessage }>): Promise<MutationOptions<{ goal: SdmGoalMessage }>> {

		if (options.name === "UpdateSdmGoal") {
			const goal = options.variables?.goal;
			if (!!goal) {
				options.variables.goal = await signGoal(goal as SdmGoalMessage & SignatureMixin, this.gsc);
			}
		}

		return options;
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
                                 ctx: HandlerContext): Promise<SdmGoalEvent> {
	if (!!gsc && gsc.enabled === true && !!goal && isInScope(gsc.scope, ctx) && !isGoalRejected(goal)) {
		if (!!goal.signature) {

			let verifiedWith: VerificationKey<any>;
			let verifiedGoal: SdmGoalEvent;
			for (const key of toArray(gsc.verificationKeys)) {
				const algorithm = findAlgorithm(key, gsc);
				verifiedGoal = await algorithm.verify(goal, goal.signature, key);
				if (verifiedGoal) {
					verifiedWith = key;
					break;
				}
			}

			if (!!verifiedWith) {
				logger.debug(
					`Verified signature for incoming goal '${goal.uniqueName}' of '${goal.goalSetId}' with key '${
						verifiedWith.name}' and algorithm '${verifiedWith.algorithm || DefaultGoalSigningAlgorithm.name}'`);
				return verifiedGoal;
			} else {
				await rejectGoal("signature invalid", goal, ctx);
				throw new Error("SDM goal signature invalid. Rejecting goal!");
			}
		} else {
			await rejectGoal("signature missing", goal, ctx);
			throw new Error("SDM goal signature is missing. Rejecting goal!");
		}
	} else {
		return goal;
	}
}

/**
 * Add a signature to a goal
 * @param goal
 * @param gsc
 */
export async function signGoal(goal: SdmGoalMessage,
                               gsc: GoalSigningConfiguration): Promise<SdmGoalMessage & SignatureMixin> {
	if (!!gsc && gsc.enabled === true && !!gsc.signingKey) {
		(goal as any).signature = await findAlgorithm(gsc.signingKey, gsc).sign(goal, gsc.signingKey);
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

function findAlgorithm(key: VerificationKey<any> | SigningKey<any>,
                       gsc: GoalSigningConfiguration): GoalSigningAlgorithm<any> {
	const algorithm = [...toArray(gsc.algorithms || []), DefaultGoalSigningAlgorithm, JwtGoalSigningAlgorithm]
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
