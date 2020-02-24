/*
 * Copyright © 2020 Atomist, Inc.
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

import { GitHubRepoRef } from "@atomist/automation-client/lib/operations/common/GitHubRepoRef";
import { GitCommandGitProject } from "@atomist/automation-client/lib/project/git/GitCommandGitProject";
import { InMemoryProject } from "@atomist/automation-client/lib/project/mem/InMemoryProject";
import * as assert from "power-assert";
import { pushTest } from "../../../../lib/api/mapping/PushTest";
import {
    mapTests,
    PushTestMaker,
} from "../../../../lib/core/machine/yaml/mapPushTests";

// tslint:disable:no-unused-expression
describe("mapPushTests", () => {

    describe("HasFile", () => {

        it("should detect hasFile", async () => {
            const yaml = {
                hasFile: "package.json",
            };
            const test = (await mapTests(yaml, {}, {}))[0];

            const p1 = InMemoryProject.of({ path: "package.json", content: "{}" });
            assert(await test.mapping({ project: p1 } as any));

            const p2 = InMemoryProject.of({ path: "pom.xml", content: "<pom></pom>" });
            assert(!await test.mapping({ project: p2 } as any));
        });

        it("should not detect hasFile without missing file name", async () => {
            const yaml = "hasFile";
            try {
                (await mapTests(yaml, {}, {}))[0];
                assert.fail();
            } catch (e) {
                assert(e.message === "Unable to construct push test from '\"hasFile\"'");
            }
        });

    });

    describe("IsRepo", () => {

        it("should detect isRepo with regexp", async () => {
            const yaml = {
                isRepo: /^atomist\/sdm$/,
            };
            const test = (await mapTests(yaml, {}, {}))[0];

            assert(await test.mapping({ id: { owner: "atomist", repo: "sdm" } } as any));
            assert(!await test.mapping({ id: { owner: "atomist", repo: "client" } } as any));
        });

        it("should detect isRepo with string", async () => {
            const yaml = {
                isRepo: "atomist\/sdm",
            };
            const test = (await mapTests(yaml, {}, {}))[0];

            assert(await test.mapping({ id: { owner: "atomist", repo: "sdm" } } as any));
            assert(!await test.mapping({ id: { owner: "atomist", repo: "client" } } as any));
        });

        it("should not detect isRepo without missing regexp", async () => {
            const yaml = "isRepo";
            try {
                (await mapTests(yaml, {}, {}))[0];
                assert.fail();
            } catch (e) {
                assert(e.message === "Unable to construct push test from '\"isRepo\"'");
            }
        });

    });

    describe("IsBranch", () => {

        it("should detect isBranch with regexp", async () => {
            const yaml = {
                isBranch: /^dev-.*$/,
            };
            const test = (await mapTests(yaml, {}, {}))[0];

            assert(await test.mapping({ push: { branch: "dev-pr-1001" } } as any));
            assert(!await test.mapping({ push: { branch: "master" } } as any));
        });

        it("should detect isBranch with string", async () => {
            const yaml = {
                isBranch: "^dev-.*$",
            };
            const test = (await mapTests(yaml, {}, {}))[0];

            assert(await test.mapping({ push: { branch: "dev-pr-1001" } } as any));
            assert(!await test.mapping({ push: { branch: "master" } } as any));
        });

        it("should not detect isBranch without missing regexp", async () => {
            const yaml = "isBranch";
            try {
                (await mapTests(yaml, {}, {}))[0];
                assert.fail();
            } catch (e) {
                assert(e.message === "Unable to construct push test from '\"isBranch\"'");
            }
        });

    });

    describe("IsDefaultBranch", () => {

        it("should detect isBranch with regexp", async () => {
            const yaml = "is_default_branch";
            const test = (await mapTests(yaml, {}, {}))[0];

            assert(!await test.mapping({ push: { branch: "dev-pr-1001", repo: { defaultBranch: "master" } } } as any));
            assert(await test.mapping({ push: { branch: "master", repo: { defaultBranch: "master" } } } as any));
        });

    });

    describe("IsGoal", () => {

        it("should detect isGoal", async () => {
            const yaml = {
                isGoal: {
                    name: "docker-build",
                },
            };
            const test = (await mapTests(yaml, {}, {}))[0];
            // Only a GoalTest will have a pushTest property
            assert(!!test.pushTest);
        });
    });

    describe("IsMaterialChange", () => {

        it("should detect isMaterialChange", async () => {
            const sha = "3a0087db2a7e1849b0ece33651b5717b1a0616b7";
            const project = await GitCommandGitProject.cloned(
                undefined,
                GitHubRepoRef.from({
                    owner: "atomist",
                    repo: "sdm",
                    sha,
                } as any));

            let yaml: any = {
                isMaterialChange: {
                    extensions: ["ts", "js"],
                },
            };
            let test = (await mapTests(yaml, {}, {}))[0];

            assert(await test.mapping({
                id: project.id,
                project,
                push: { after: { sha } },
            } as any));

            yaml = {
                isMaterialChange: {
                    files: ["lib/api/mapping/goalTest.ts"],
                },
            };
            test = (await mapTests(yaml, {}, {}))[0];
            assert(await test.mapping({
                id: project.id,
                project,
                push: { after: { sha } },
            } as any));

            yaml = {
                isMaterialChange: {
                    pattern: ["**/goalTest.ts"],
                },
            };
            test = (await mapTests(yaml, {}, {}))[0];
            assert(await test.mapping({
                id: project.id,
                project,
                push: { after: { sha } },
            } as any));

            yaml = {
                isMaterialChange: {
                    directories: ["lib"],
                },
            };
            test = (await mapTests(yaml, {}, {}))[0];
            assert(await test.mapping({
                id: project.id,
                project,
                push: { after: { sha } },
            } as any));
        }).timeout(20000);

        it("should not detect isMaterialChange without missing parameters", async () => {
            const yaml = "isMaterialChange";
            try {
                (await mapTests(yaml, {}, {}))[0];
                assert.fail();
            } catch (e) {
                assert(e.message === "Unable to construct push test from '\"isMaterialChange\"'");
            }
        });

    });

    describe("HasFileContaining", () => {

        it("should detect hasFileContaining", async () => {
            const yaml = {
                hasFileContaining: {
                    content: "atomist-foo",
                    patterns: "package.json",
                },
            };
            const test = (await mapTests(yaml, {}, {}))[0];

            const p1 = InMemoryProject.of({ path: "package.json", content: "{ \"name:\": \"@atomist/atomist-foo\" }" });
            assert(await test.mapping({ project: p1 } as any));

            const p2 = InMemoryProject.of({ path: "pom.xml", content: "<pom></pom>" });
            assert(!await test.mapping({ project: p2 } as any));
        });

        it("should not detect hasFileContaining without missing parameters", async () => {
            const yaml = "hasFileContaining";
            try {
                (await mapTests(yaml, {}, {}))[0];
                assert.fail();
            } catch (e) {
                assert(e.message === "Unable to construct push test from '\"hasFileContaining\"'");
            }
        });

        it("should not detect hasFileContaining without missing content property", async () => {
            const yaml = {
                hasFileContaining: {
                    patterns: "package.json",
                },
            };
            try {
                (await mapTests(yaml, {}, {}))[0];
                assert.fail();
            } catch (e) {
                assert(e.message === "Push test 'hasFileContaining' can't be used without 'content' property");
            }
        });

    });

    describe("AdditionalTest", () => {

        it("should find test", async () => {
            const alwaysTrue = pushTest("always true", async () => true);
            const alwaysFalse = pushTest("always false", async () => false);
            const yaml = { use: "alwaysTrue" };
            const test = (await mapTests(yaml, { alwaysTrue, alwaysFalse }, {}))[0];
            assert(await test.mapping({} as any));
        });

    });

    describe("ExtensionTest", () => {

        it("should find test with parameters", async () => {
            const sometimesTrue: PushTestMaker = (params: any) => pushTest("always true", async () => params.shouldbeTrue);
            const yaml = {
                use: "sometimesTrue",
                parameters: { shouldbeTrue: true },
            };
            const test = (await mapTests(yaml, {}, { sometimesTrue }))[0];
            assert(await test.mapping({} as any));
        });

        it("should find test with parameters and only push predicate", async () => {
            const sometimesTrue: PushTestMaker = (params: any) => async () => params.shouldbeTrue;
            const yaml = {
                use: "sometimesTrue",
                parameters: { shouldbeTrue: true },
            };
            const test = (await mapTests(yaml, {}, { sometimesTrue }))[0];
            assert(await test.mapping({} as any));
        });

        it("should find test without parameters", async () => {
            const alwaysTrue = () => pushTest("always true", async () => true);
            const alwaysFalse = () => pushTest("always false", async () => false);
            const yaml = { use: "alwaysFalse" };
            const test = (await mapTests(yaml, {}, { alwaysTrue, alwaysFalse }))[0];
            assert(!await test.mapping({} as any));
        });

    });

    describe("And", () => {

        it("should correctly evaluate true and false", async () => {
            const alwaysTrue = pushTest("always true", async () => true);
            const alwaysFalse = pushTest("always false", async () => false);
            const yaml = {
                and: [{ use: "alwaysTrue" }, { use: "alwaysFalse" }],
            };
            const test = (await mapTests(yaml, { alwaysTrue, alwaysFalse }, {}))[0];
            assert(!await test.mapping({} as any));
        });

        it("should correctly evaluate true and true", async () => {
            const alwaysTrue = pushTest("always true", async () => true);
            const alwaysFalse = pushTest("always false", async () => false);
            const yaml = {
                and: [{ use: "alwaysTrue" }, { use: "alwaysTrue" }],
            };
            const test = (await mapTests(yaml, { alwaysTrue, alwaysFalse }, {}))[0];
            assert(await test.mapping({} as any));
        });
    });

    describe("Or", () => {

        it("should correctly evaluate true and false", async () => {
            const alwaysTrue = pushTest("always true", async () => true);
            const alwaysFalse = pushTest("always false", async () => false);
            const yaml = {
                or: [{ use: "alwaysTrue" }, { use: "alwaysFalse" }],
            };
            const test = (await mapTests(yaml, { alwaysTrue, alwaysFalse }, {}))[0];
            assert(await test.mapping({} as any));
        });

        it("should correctly evaluate true and true", async () => {
            const alwaysTrue = pushTest("always true", async () => true);
            const alwaysFalse = pushTest("always false", async () => false);
            const yaml = {
                or: [{ use: "alwaysTrue" }, { use: "alwaysTrue" }],
            };
            const test = (await mapTests(yaml, { alwaysTrue, alwaysFalse }, {}))[0];
            assert(await test.mapping({} as any));
        });
    });

    describe("Not", () => {

        it("should correctly evaluate true", async () => {
            const alwaysTrue = pushTest("always true", async () => true);
            const yaml = {
                not: { use: "alwaysTrue" },
            };
            const test = (await mapTests(yaml, { alwaysTrue }, {}))[0];
            assert(!await test.mapping({} as any));
        });

        it("should correctly evaluate true and true", async () => {
            const alwaysFalse = pushTest("always false", async () => false);
            const yaml = {
                not: { use: "alwaysFalse" },
            };
            const test = (await mapTests(yaml, { alwaysFalse }, {}))[0];
            assert(await test.mapping({} as any));
        });
    });

    describe("Logical combinations", () => {

        it("should correctly evaluate combination of and and not", async () => {
            const alwaysTrue = pushTest("always true", async () => true);
            const alwaysFalse = pushTest("always false", async () => false);
            const yaml = {
                and: [
                    { use: "alwaysTrue" },
                    {
                        not: { use: "alwaysFalse" },
                    },
                ],
            };
            const test = (await mapTests(yaml, { alwaysTrue, alwaysFalse }, {}))[0];
            assert(await test.mapping({} as any));
        });

        it("should correctly evaluate combination of and and or", async () => {
            const alwaysTrue = pushTest("always true", async () => true);
            const alwaysFalse = pushTest("always false", async () => false);
            const yaml = {
                and: [
                    { use: "alwaysTrue" },
                    {
                        or: [
                            { use: "alwaysFalse" },
                            { use: "alwaysTrue" },
                        ],
                    },
                ],
            };
            const test = (await mapTests(yaml, { alwaysTrue, alwaysFalse }, {}))[0];
            assert(await test.mapping({} as any));
        });
    });
});
