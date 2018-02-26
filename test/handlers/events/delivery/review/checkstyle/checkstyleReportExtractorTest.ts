import "mocha";

import * as assert from "power-assert";

import { extract } from "../../../../../../src/handlers/events/delivery/scan/review/checkstyle/checkstyleReportExtractor";

describe("checkstyleReportExtractor", () => {

    it("should parse valid output", async () => {
        const report = await extract(xml2valid1);
        assert(!!report);
        assert(report.files.length === 2);
        const file = report.files[0];
        assert(file.name === "/Users/rodjohnson/tools/checkstyle-8.8/Test.java");
        assert(file.errors.length === 2);
        file.errors.forEach(f => assert(!!f.message, "Message must be set"));
        file.errors.forEach(f => assert(!!f.severity, "Severity must be set"));

    });

});

/* tslint:disable */

export const xml2valid1 = `<?xml version="1.0" encoding="UTF-8"?>
<checkstyle version="8.8">
<file name="/Users/rodjohnson/tools/checkstyle-8.8/Test.java">
<error line="0" severity="error" message="Missing package-info.java file." source="com.puppycrawl.tools.checkstyle.checks.javadoc.JavadocPackageCheck"/>
<error line="1" severity="error" message="Missing a Javadoc comment." source="com.puppycrawl.tools.checkstyle.checks.javadoc.JavadocTypeCheck"/>
</file>
<file name="/Users/rodjohnson/tools/checkstyle-8.8/src/main/java/thing/Test2.java">
<error line="0" severity="error" message="Missing package-info.java file." source="com.puppycrawl.tools.checkstyle.checks.javadoc.JavadocPackageCheck"/>
<error line="1" severity="error" message="Missing a Javadoc comment." source="com.puppycrawl.tools.checkstyle.checks.javadoc.JavadocTypeCheck"/>
</file>
</checkstyle>
`;
