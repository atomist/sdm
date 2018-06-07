import { logger } from "@atomist/automation-client";
import { FingerprintListener } from "../../../../api/listener/FingerprintListener";

/**
 * Display fingerprints to the user
 * @param {FingerprintListenerInvocation} fli
 * @return {Promise<Logger>}
 * @constructor
 */
export const LogFingerprint: FingerprintListener = async fli =>
    logger.info("FINGERPRINT: %j", fli.fingerprint);
