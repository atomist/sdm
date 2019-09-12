/*
 * Copyright © 2019 Atomist, Inc.
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

import {
    GitProject,
    GitStatus,
} from "@atomist/automation-client";
import * as assert from "power-assert";
import { spawnCodeTransform } from "../../../../lib/api-helper/command/transform/spawnCodeTransform";
import {
    CodeTransform,
    TransformResult,
} from "../../../../lib/api/registration/CodeTransform";

describe("spawnCodeTransform", () => {

    describe("spawnCodeTransform", () => {

        it("should return a function that runs a command", async () => {
            const p: GitProject = {
                baseDir: ".",
                gitStatus: async () => Promise.resolve({ isClean: true }),
            } as any;
            const t = spawnCodeTransform([
                { command: "node", args: ["-e", "process.exit(0);"] },
            ]);
            const r = await t(p, {} as any) as TransformResult;
            assert(r);
            assert(r.target);
            assert(r.success === true);
            assert(r.edited === false);
            assert(!r.error);
            assert(!r.errorStep);
        });

        it("should return a function that runs a command that edits the project", async () => {
            const p: GitProject = {
                baseDir: ".",
                gitStatus: async () => Promise.resolve({ isClean: false }),
            } as any;
            const t = spawnCodeTransform([
                { command: "node", args: ["-e", "process.exit(0);"] },
            ]);
            const r = await t(p, {} as any) as TransformResult;
            assert(r);
            assert(r.target);
            assert(r.success === true);
            assert(r.edited === true);
            assert(!r.error);
            assert(!r.errorStep);
        });

        it("should return a function that runs several commands", async () => {
            const p: GitProject = {
                baseDir: ".",
                gitStatus: async () => Promise.resolve({ isClean: true }),
            } as any;
            const t = spawnCodeTransform([
                { command: "node", args: ["-e", "process.exit(0);"] },
                { command: "node", args: ["-e", "process.exit(0);"] },
                { command: "node", args: ["-e", "process.exit(0);"] },
            ]);
            const r = await t(p, {} as any) as TransformResult;
            assert(r);
            assert(r.target);
            assert(r.success === true);
            assert(r.edited === false);
            assert(!r.error);
            assert(!r.errorStep);
        });

        it("should return a function that runs a command that fails", async () => {
            const p: GitProject = {
                baseDir: ".",
                gitStatus: async () => Promise.resolve({ isClean: true }),
            } as any;
            const t = spawnCodeTransform([
                { command: "node", args: ["-e", "process.exit(1);"] },
            ]);
            const r = await t(p, {} as any) as TransformResult;
            assert(r);
            assert(r.target);
            assert(r.success === false);
            assert(r.edited === false);
            assert(r.error);
            assert(r.error.message.endsWith("node '-e' 'process.exit(1);'"));
            assert(r.errorStep === ". ==> node '-e' 'process.exit(1);'");
        });

        it("should return a function that runs a command that edits a project and fails", async () => {
            const p: GitProject = {
                baseDir: ".",
                gitStatus: async () => Promise.resolve({ isClean: false }),
            } as any;
            const t = spawnCodeTransform([
                { command: "node", args: ["-e", "process.exit(4);"] },
            ]);
            const r = await t(p, {} as any) as TransformResult;
            assert(r);
            assert(r.target);
            assert(r.success === false);
            assert(r.edited === true);
            assert(r.error);
            assert(r.error.message.endsWith("node '-e' 'process.exit(4);'"));
            assert(r.errorStep === ". ==> node '-e' 'process.exit(4);'");
        });

        it("should return a function that short circuits on failure", async () => {
            const p: GitProject = {
                baseDir: ".",
                gitStatus: async () => Promise.resolve({ isClean: true }),
            } as any;
            const t = spawnCodeTransform([
                { command: "node", args: ["-e", "process.exit(2);"] },
                { command: "node", args: ["-e", "process.exit(0);"] },
            ]);
            const r = await t(p, {} as any) as TransformResult;
            assert(r);
            assert(r.target);
            assert(r.success === false);
            assert(r.edited === false);
            assert(r.error);
            assert(r.error.message.endsWith("node '-e' 'process.exit(2);'"));
            assert(r.errorStep === ". ==> node '-e' 'process.exit(2);'");
        });

    });

});
