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
