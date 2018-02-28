
import { ListenerInvocation, SdmListener } from "./Listener";

export interface FingerprintValue {
    name: string;
    sha: string;
    data: string;
}

/**
 * Represents the difference of two fingerprints with the same name.
 * Note that a fingerprint may be added or removed, so calling
 * code must check
 */
export interface FingerprintDifference {
    oldValue?: FingerprintValue;
    newValue?: FingerprintValue;
}

export interface FingerprintDifferenceInvocation extends ListenerInvocation {

    diffs: FingerprintDifference[];
}

/**
 * React to a fingerprint diff
 */
export type FingerprintDifferenceListener = SdmListener<FingerprintDifferenceInvocation>;
