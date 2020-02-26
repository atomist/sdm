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

import { LocalProject } from "@atomist/automation-client/lib/project/local/LocalProject";
import { execPromise } from "@atomist/automation-client/lib/util/child_process";
import * as assert from "power-assert";
import { SdmGoalEvent } from "../../../../../lib/api/goal/SdmGoalEvent";
import {
    diffPush,
    parseNameStatusDiff,
    PushDiff,
} from "../../../../../lib/core/pack/k8s/sync/diff";
import { ProgressLog } from "../../../../../lib/spi/log/ProgressLog";

describe("pack/k8s/sync/diff", () => {

    describe("parseNameStatusDiff", () => {

        it("should safely parse nothing", () => {
            const s = "87c6ba8a3e2e3961d318fa8c50885b1ca0c4e1dc";
            ["", "\n", "\0", "\0\n"].forEach(d => {
                const c = parseNameStatusDiff(s, d);
                const e: PushDiff[] = [];
                assert.deepStrictEqual(c, e);
            });
        });

        it("should parse valid input", () => {
            const s = "87c6ba8a3e2e3961d318fa8c50885b1ca0c4e1dc";
            const ds = [
                "D\0a.yaml\0A\0aa.json\0D\0b.yml\0A\0d.json\0M\0e.json\0A\0fyml\0A\0i/j/k/l.json\0A\0s t.json\0M\0x.yaml\0",
                "D\0a.yaml\0A\0aa.json\0D\0b.yml\0A\0d.json\0M\0e.json\0A\0fyml\0A\0i/j/k/l.json\0A\0s t.json\0M\0x.yaml\0\n",
            ];
            ds.forEach(d => {
                const c = parseNameStatusDiff(s, d);
                const e: PushDiff[] = [
                    { sha: s, change: "delete", path: "a.yaml" },
                    { sha: s, change: "delete", path: "b.yml" },
                    { sha: s, change: "apply", path: "aa.json" },
                    { sha: s, change: "apply", path: "d.json" },
                    { sha: s, change: "apply", path: "e.json" },
                    { sha: s, change: "apply", path: "s t.json" },
                    { sha: s, change: "apply", path: "x.yaml" },
                ];
                assert.deepStrictEqual(c, e);
            });
        });

        it("should sort the paths", () => {
            const s = "87c6ba8a3e2e3961d318fa8c50885b1ca0c4e1dc";
            const d = "D\0a.yaml\0A\0s t.json\0D\0b.yml\0A\0d.json\0M\0e.json\0A\0aa.json\0A\0i/j/k/l.json\0M\0x.yaml\0A\0f\0\n";
            const c = parseNameStatusDiff(s, d);
            const e: PushDiff[] = [
                { sha: s, change: "delete", path: "a.yaml" },
                { sha: s, change: "delete", path: "b.yml" },
                { sha: s, change: "apply", path: "aa.json" },
                { sha: s, change: "apply", path: "d.json" },
                { sha: s, change: "apply", path: "e.json" },
                { sha: s, change: "apply", path: "s t.json" },
                { sha: s, change: "apply", path: "x.yaml" },
            ];
            assert.deepStrictEqual(c, e);
        });

    });

    describe("diffPush", function(this: Mocha.Suite): void {

        this.timeout(10000);

        before(async function(this: Mocha.Context): Promise<void> {
            try {
                await execPromise("git", ["fetch", "origin", "test-branch-do-not-delete"]);
            } catch (e) {
                this.skip();
            }
        });

        it("should run git diff and parse output", async () => {
            const p: LocalProject = {
                baseDir: process.cwd(),
            } as any;
            const push: SdmGoalEvent["push"] = {
                commits: [
                    {
                        sha: "b9be09922b378a2be4b2efad9dd694f489e59f71",
                        message: "Senseless changes to test diffPush",
                    },
                    {
                        sha: "207ae8f93e59be4a218eacd08845d07c4b81e89c",
                        message: `Autofix: TypeScript header

[atomist:generated] [atomist:autofix=typescript_header]`,
                    },
                    {
                        sha: "81a5d5dfa4bb44a10eeb431953c0cf08910b7131",
                        message: `Change package description

[atomist:generated] [atomist:commit:test]
`,
                    },
                    {
                        sha: "28c3f487a7de64945bef599e971116d37704869d",
                        message: "Update, add, delete files, plus ignored changes",
                    },
                ],
            };
            const t = "[atomist:commit:test]";
            let logs: string = "";
            const l: ProgressLog = {
                write: (d: string) => logs += d,
            } as any;
            const c = await diffPush(p, push, t, l);
            const e = [
                { change: "delete", path: "package-lock.json", sha: "b9be09922b378a2be4b2efad9dd694f489e59f71" },
                { change: "apply", path: "test.json", sha: "b9be09922b378a2be4b2efad9dd694f489e59f71" },
                { change: "apply", path: "tslint.json", sha: "b9be09922b378a2be4b2efad9dd694f489e59f71" },
                { change: "apply", path: "package-lock.json", sha: "207ae8f93e59be4a218eacd08845d07c4b81e89c" },
                { change: "delete", path: "package-lock.json", sha: "28c3f487a7de64945bef599e971116d37704869d" },
                { change: "delete", path: "package.json", sha: "28c3f487a7de64945bef599e971116d37704869d" },
                { change: "apply", path: "blaml.yaml", sha: "28c3f487a7de64945bef599e971116d37704869d" },
                { change: "apply", path: "test.json", sha: "28c3f487a7de64945bef599e971116d37704869d" },
            ];
            assert.deepStrictEqual(c, e);
        });

    });

});
