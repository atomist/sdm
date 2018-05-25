import { Fingerprint } from "@atomist/automation-client/project/fingerprint/Fingerprint";
import { computeShaOf } from "../../../../../util/misc/sha";

/**
 * Convenient superclass for fingerprints.
 */
export abstract class AbstractFingerprint implements Fingerprint {

    protected constructor(public readonly name,
                          public readonly abbreviation,
                          public readonly version) {
    }

    abstract get data();

    get sha() {
        return computeShaOf(this.data);
    }
}
