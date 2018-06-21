/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as assert from "power-assert";
import { JavaIdentifierRegExp, JavaPackageRegExp, MavenGroupIdRegExp } from "../../../../../src/handlers/commands/support/java/javaPatterns";

describe("javaPatterns", () => {

    describe("JavaIdentifierRegExp", () => {

        it("should match valid identifiers", () => {
            const identifiers = [
                "x",
                "x3",
                "comfoBarBazbar",
                "BAR_Z",
                "_article",
                "barnacle_17_644_foo",
                "ClassName",
                "$className",
            ];
            identifiers.forEach(b => assert(JavaIdentifierRegExp.pattern.test(b)));
        });

        it("should reject invalid identifiers", () => {
            const identifiers = [
                "1x",
                "com-1",
                "com.foo-1.bar",
                "c%",
                "com.f",
            ];
            identifiers.forEach(b => assert(!JavaIdentifierRegExp.pattern.test(b)));
        });

    });

    describe("JavaPackageRegExp", () => {

        it("should match valid packages", () => {
            const packages = [
                "",
                "com",
                "com.foo.bar",
                "com1",
                "Fuga21",
            ];
            packages.forEach(b => assert(JavaPackageRegExp.pattern.test(b)));
        });

        it("should reject invalid packages", () => {
            const packages = [
                "1x",
                "com-1",
                "com.foo-1.bar",
                "c%",
            ];
            packages.forEach(b => assert(!JavaPackageRegExp.pattern.test(b)));
        });

    });

    describe("MavenGroupIdRegExp", () => {

        it("should match valid ids", () => {
            const ids = [
                "atomist",
                "atomist-seeds",
                "com.foo.bar",
                "test_1",
            ];
            ids.forEach(b => assert(MavenGroupIdRegExp.pattern.test(b)));
        });

        it("should reject invalid ids", () => {
            const ids = [
                "&345",
                "'66",
                "c%",
            ];
            ids.forEach(b =>
                assert(!MavenGroupIdRegExp.pattern.test(b), "Should have failed on " + b));
        });

    });

});
