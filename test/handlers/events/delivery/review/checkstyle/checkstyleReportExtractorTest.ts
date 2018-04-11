/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as assert from "power-assert";

import { extract } from "../../../../../../src/common/delivery/code/review/checkstyle/checkstyleReportExtractor";

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
