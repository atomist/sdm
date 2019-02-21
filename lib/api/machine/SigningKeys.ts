/*
 * Copyright © 2019 Atomist, Inc.
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

export interface GoalVerificationKey {
    name: string;
    publicKey: string;
}

/**
 * Private/public key pair to use for SDM goal signing and verification
 */
export interface GoalSigningKey extends GoalVerificationKey {
    privateKey: string;
    passphrase?: string;
}

export interface GoalSigningConfiguration {

    /**
     * Enable goal signature verification on this SDM.
     */
    enabled: boolean;

    /**
     * Public/Private key pair to use for goal signing.
     * The public key will also be used to verify incoming goals.
     */
    signingKey: GoalSigningKey;

    /**
     * Public keys to verify incoming goals
     */
    verificationKeys?: GoalVerificationKey | GoalVerificationKey[];
}
