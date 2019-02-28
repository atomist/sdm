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

export interface GoalVerificationKey<T> {
    name: string;
    publicKey: T;
    algorithm?: string;
}

/**
 * Private/public key pair to use for SDM goal signing and verification
 */
export interface GoalSigningKey<T> extends GoalVerificationKey<T> {
    privateKey: T;
    passphrase?: string;
}

/**
 * Defines the scope of which goes get signed and validated
 */
export enum GoalSigningScope {
    Fulfillment = "fulfillment",
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
     * Sign the provided normalized goal with the given key
     */
    sign(goal: string, key: GoalSigningKey<T>): Promise<string>;

    /**
     * Verify the provided normalized goal against the signature
     */
    verify(goal: string, signature: string, key: GoalVerificationKey<T>): Promise<boolean>;
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
    signingKey?: GoalSigningKey<any>;

    /**
     * Public keys to verify incoming goals
     */
    verificationKeys?: GoalVerificationKey<any> | Array<GoalVerificationKey<any>>;

    /**
     * Algorithms to use for signing and verification
     */
    algorithms: GoalSigningAlgorithm<any> | Array<GoalSigningAlgorithm<any>>;
}
