import { logger } from "@atomist/automation-client";
import { FingerprintListener } from "../../api/listener/FingerprintListener";

export const LogFingerprint: FingerprintListener = async fli =>
    logger.info("FINGERPRINT: %j", fli.fingerprint);
