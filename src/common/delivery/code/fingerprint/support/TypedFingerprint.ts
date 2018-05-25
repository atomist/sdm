import { AbstractFingerprint } from "./AbstractFingerprint";

/**
 * Typed fingerprint. Takes care of serializing the passed in data structure.
 */
export class TypedFingerprint<T> extends AbstractFingerprint {

    public constructor(name: string,
                       abbreviation: string,
                       version: string,
                       private readonly t: T) {
        super(name, abbreviation, version);
    }

    get data(): string {
        return JSON.stringify(this.t);
    }

    /**
     * Return the fingerprint as a JSON object
     * @return {T}
     */
    get object(): T {
        return JSON.parse(this.data);
    }

}
