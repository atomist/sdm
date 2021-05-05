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
import { SdmGoalEvent } from "../../api/goal/SdmGoalEvent";
import { SdmGoalMessage } from "../../api/goal/SdmGoalMessage";
import {
    GoalSigningAlgorithm,
    SigningKey,
    VerificationKey,
} from "../../api/machine/SigningKeys";

/**
 * JWT based GoalSigningAlgorithm
 *
 * Generate keys:
 *
 * openssl ecparam -genkey -name secp521r1 -noout -out es512-private.pem
 * openssl ec -in es512-private.pem -pubout -out es512-public.pem
 */
export const JwtGoalSigningAlgorithm: GoalSigningAlgorithm<string> = {

    name: "jwt-es512",

    sign: async (goal: SdmGoalMessage, key: SigningKey<string>) => {
        const privateKey = crypto.createPrivateKey({
            key: key.privateKey,
            passphrase: key.passphrase,
        });
        const { default: CompactSign } = require("jose/jws/compact/sign");
        const jws = await new CompactSign(Buffer.from(JSON.stringify(goal)))
            .setProtectedHeader({ alg: "ES512" })
            .sign(privateKey);
        return jws;
    },

    verify: async (goal: SdmGoalEvent, signatureString: string, key: VerificationKey<string>) => {
        const publicKey = crypto.createPublicKey({
            key: key.publicKey,
        });
        const { default: compactVerify } = require("jose/jws/compact/verify");
        try {
            const { payload } = await compactVerify(signatureString, publicKey);
            return JSON.parse(Buffer.from(payload).toString()) as SdmGoalEvent;
        } catch (e) {
            return undefined;
        }
    },
};
