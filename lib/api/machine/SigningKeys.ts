/**
 * Key to verify incoming SDM goals
 */
export type GoalVerificationKey = { publicKey: string };

/**
 * Private/public key pair to use for SDM goal signing and verification
 */
export type GoalSigningKey = { privateKey: string, passphrase?: string } & GoalVerificationKey;
