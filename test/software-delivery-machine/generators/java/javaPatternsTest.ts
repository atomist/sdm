import "mocha";
import * as assert from "power-assert";
import {
    JavaPackageRegExp,
    MavenGroupIdRegExp
} from "../../../../src/software-delivery-machine/commands/generators/java/javaPatterns";

describe("javaPatterns", () => {

    describe("JavaPackageRegExp", () => {

        it("should match valid packages", () => {
            const branches = [
                "",
                "com",
                "com.foo.bar",
                "com1",
                "Fuga21",
            ];
            branches.forEach(b => assert(JavaPackageRegExp.pattern.test(b)));
        });

        it("should reject invalid packages", () => {
            const branches = [
                "1x",
                "com-1",
                "com.foo-1.bar",
                "c%",
            ];
            branches.forEach(b => assert(!JavaPackageRegExp.pattern.test(b)));
        });

    });

    describe("MavenGroupIdRegExp", () => {

        it("should match valid ids", () => {
            const branches = [
                "atomist",
                "atomist-seeds",
                "com.foo.bar",
                "test_1",
            ];
            branches.forEach(b => assert(MavenGroupIdRegExp.pattern.test(b)));
        });

        it("should reject invalid packages", () => {
            const branches = [
                "&345",
                "'66",
                "c%",
            ];
            branches.forEach(b =>
                assert(!MavenGroupIdRegExp.pattern.test(b), "Should have failed on " + b));
        });

    });

});
