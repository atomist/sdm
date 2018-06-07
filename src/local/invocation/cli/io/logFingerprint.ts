import { FingerprintListener } from "../../../../api/listener/FingerprintListener";
import { writeToConsole } from "../support/consoleOutput";

/**
 * Display fingerprints to the user
 * @param {FingerprintListenerInvocation} fli
 * @return {Promise<Logger>}
 * @constructor
 */
export const LogFingerprint: FingerprintListener = async fli =>
    writeToConsole("FINGERPRINT: %j", fli.fingerprint);
