import * as assert from "assert";
import { toFlattenedProperties } from "../../../../src/api/command/support/buttons";

describe("toFlattenedProperties", () => {

    it("should handle undefined", () => {
        const props = toFlattenedProperties(undefined);
        assert.deepEqual(props, {});
    });

    it("should handle simple property", () => {
        const props = toFlattenedProperties({ name: "Fred" });
        assert.deepEqual(props, { name: "Fred" });
    });

    it("should handle nested property", () => {
        const props = toFlattenedProperties({ name: "Fred", address: { street: "somewhere" } });
        assert.deepEqual(props, { "name": "Fred", "address.street": "somewhere" });
    });

    it("should handle nested nested property", () => {
        const props = toFlattenedProperties({ name: "Fred", address: { street: "somewhere", zip: { code: "12345" } } });
        assert.deepEqual(props, { "name": "Fred", "address.street": "somewhere", "address.zip.code": "12345" });
    });
});
