/**
 * Key to verify incoming SDM goals
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
