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

import { SdmGoalEvent } from "../goal/SdmGoalEvent";
import { SdmGoalMessage } from "../goal/SdmGoalMessage";

export interface VerificationKey<T> {
    name: string;
    publicKey: T;
    algorithm?: string;
}

/**
 * Private/public key pair to use for SDM goal signing and verification
 */
export interface SigningKey<T> extends VerificationKey<T> {
    privateKey: T;
    passphrase?: string;
}

/**
 * Defines the scope of which goes get signed and validated
 */
export enum GoalSigningScope {

    /**
     * Only verify incoming goals for fulfillment
     */
    Fulfillment = "fulfillment",

    /**
     * Verify each incoming goal into any of the SDM event handlers
     */
    All = "all",
}

/**
 * Strategy for implementing different signature algorithms
 */
export interface GoalSigningAlgorithm<T> {

    /**
     * Return the name of this algorithm
     */
    name: string;

    /**
     * Sign the provided goal with the given key
     */
    sign(goal: SdmGoalMessage, key: SigningKey<T>): Promise<string>;

    /**
     * Verify the provided goal against the signature
     */
    verify(goal: SdmGoalEvent, signature: string, key: VerificationKey<T>): Promise<SdmGoalEvent>;
}

export interface GoalSigningConfiguration {

    /**
     * Enable goal signature verification on this SDM.
     */
    enabled: boolean;

    /**
     * Scope for goal signing:
     *
     * Fulfillment: only verify goals before fulfillment
     * All: verify goals during all phases of a goal set execution
     */
    scope: GoalSigningScope;

    /**
     * Public/Private key pair to use for goal signing.
     * The public key will also be used to verify incoming goals.
     */
    signingKey?: SigningKey<any>;

    /**
     * Public keys to verify incoming goals
     */
    verificationKeys?: VerificationKey<any> | Array<VerificationKey<any>>;

    /**
     * Algorithms to use for signing and verification
     *
     * Default RSA-SHA512 algorithm will always be available
     */
    algorithms?: GoalSigningAlgorithm<any> | Array<GoalSigningAlgorithm<any>>;
}

export interface EventSigningConfiguration {

    /**
     * Enable event signature verification on this SDM.
     */
    enabled: boolean;

    /**
     * Regular expressions matching subscription and mutation names
     * to identify events that should be verified.
     */
    events: string[];

    /**
     * Public/Private key pair to use for event signing.
     * The public key will also be used to verify incoming events.
     */
    signingKey?: SigningKey<any>;

    /**
     * Public keys to verify incoming events
     */
    verificationKeys?: VerificationKey<any> | Array<VerificationKey<any>>;

}
