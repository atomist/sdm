import { FingerprintListener } from "../../../../api/listener/FingerprintListener";

/**
 * Display fingerprints to the user
 * @param {FingerprintListenerInvocation} fli
 * @return {Promise<Logger>}
 * @constructor
 */
export const AddressChannelsFingerprintListener: FingerprintListener = async fli =>
    fli.addressChannels(`*Fingerprint*: \`${JSON.stringify(fli.fingerprint)}\``);
