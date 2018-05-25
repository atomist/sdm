import * as assert from "power-assert";
import { TypedFingerprint } from "../../../../../../src/common/delivery/code/fingerprint/support/TypedFingerprint";
import { isValidSHA1 } from "../../../../../../src/util/misc/sha";

interface Person {
    name: string;
    age: number;
}

describe("TypedFingerprint", () => {

    it("should convert valid data", () => {
        const fp = new TypedFingerprint<Person>("name", "ABR", "0.1.0", {
            name: "tony",
            age: 65,
        });
        assert.equal(fp.object.name, "tony");
        assert.equal(fp.object.age, 65);
        assert.equal(JSON.parse(fp.data).name, "tony");
        assert.equal(JSON.parse(fp.data).age, 65);
    });

    it("should compute sha", () => {
        const fp = new TypedFingerprint<Person>("name", "ABR", "0.1.0", {
            name: "tony",
            age: 65,
        });
        assert(!!fp.sha);
        assert(isValidSHA1(fp.sha));
    });

});
