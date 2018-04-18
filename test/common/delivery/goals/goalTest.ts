import * as assert from "power-assert";
import { MessageGoal } from "../../../../src";

describe("Goal", () => {

    it("should require camel case name", () => {
        [" bad name", "#234029384", "1tttt", "3Ter"].forEach(rejectName);
    });

    it("should accept camel case name", () => {
        ["camelCase", "UpperCamel"].forEach(name => new MessageGoal(name));
    });
});

function rejectName(name: string) {
    assert.throws(() => new MessageGoal(name),
        `Should reject goal name '${name}'`);
}
