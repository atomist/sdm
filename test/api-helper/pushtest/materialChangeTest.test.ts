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

import assert = require("power-assert");
import {
    anyFileChanged,
    MaterialChangeOptions,
} from "../../../lib/api-helper/pushtest/materialChangeTest";

describe("isMaterialChange", () => {

    describe("anyFileChanged", () => {

        it("should match directories", () => {
            const options: MaterialChangeOptions = {
                directories: [".atomist", "src/main"],
            };

            const changedFiles: string[] = [
                "src/test/bla.java",
                ".atomist/kube/service.json",
            ];

            assert(anyFileChanged(options, changedFiles));

        });

        it("should not match directories", () => {
            const options: MaterialChangeOptions = {
                directories: ["src/main"],
            };

            const changedFiles: string[] = [
                "src/test/bla.java",
                ".atomist/kube/service.json",
            ];

            assert(!anyFileChanged(options, changedFiles));

        });

        it("should match extensions", () => {
            const options: MaterialChangeOptions = {
                extensions: ["json", "java"],
            };

            const changedFiles: string[] = [
                "src/test/bla.java",
                ".atomist/kube/service.json",
            ];

            assert(anyFileChanged(options, changedFiles));

        });

        it("should match extensions that are specified with . in front of them", () => {
            const options: MaterialChangeOptions = {
                extensions: [".json", ".java"],
            };

            const changedFiles: string[] = [
                "src/test/bla.java",
                ".atomist/kube/service.json",
            ];

            assert(anyFileChanged(options, changedFiles));

        });

        it("should not match extensions", () => {
            const options: MaterialChangeOptions = {
                extensions: ["ts"],
            };

            const changedFiles: string[] = [
                "src/test/bla.java",
                ".atomist/kube/service.json",
            ];

            assert(!anyFileChanged(options, changedFiles));

        });

        it("should match files", () => {
            const options: MaterialChangeOptions = {
                files: ["src/test/pom.xml"],
            };

            const changedFiles: string[] = [
                "src/test/pom.xml",
                ".atomist/kube/service.json",
            ];

            assert(anyFileChanged(options, changedFiles));

        });

        it("should not match files", () => {
            const options: MaterialChangeOptions = {
                files: ["src/main/pom.xml"],
            };

            const changedFiles: string[] = [
                "src/test/pom.xml",
                ".atomist/kube/service.json",
            ];

            assert(!anyFileChanged(options, changedFiles));

        });

        it("should match globs", () => {
            const options: MaterialChangeOptions = {
                globs: ["**/pom.xml"],
            };

            const changedFiles: string[] = [
                "src/test/pom.xml",
                ".atomist/kube/service.json",
            ];

            assert(anyFileChanged(options, changedFiles));

        });

        it("should not match globs", () => {
            const options: MaterialChangeOptions = {
                globs: ["**/*.ts"],
            };

            const changedFiles: string[] = [
                "src/test/pom.xml",
                ".atomist/kube/service.json",
            ];

            assert(!anyFileChanged(options, changedFiles));

        });

        it("should match combination from atomist-sdm", () => {
            const options: MaterialChangeOptions = {
                extensions: ["ts", "json", "graphql"],
                files: ["Dockerfile", ".gitattributes", ".npmignore", ".dockerignore", ".gitignore"],
                directories: [".atomist/", "legal"],
            };

            assert(anyFileChanged(options, [
                "src/test/atomist.config.ts",
                ".atomist/kube/service.json",
            ]));

            assert(anyFileChanged(options, [
                "Dockerfile",
                ".atomist/kube/service.json",
            ]));

            assert(anyFileChanged(options, [
                "Dockerfile",
                ".atomist/kube/service.json",
                ".gitignore",
            ]));

            assert(anyFileChanged(options, [
                "src/test/atomist.config.ts",
                "legal/kube/service.json",
            ]));
        });

    });

});
