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

import {
    GitProject,
    GitStatus,
} from "@atomist/automation-client";
import * as assert from "power-assert";
import { spawnAutofix } from "../../../../lib/api-helper/code/autofix/spawnAutofix";
import { predicatePushTest } from "../../../../lib/api/mapping/PushTest";
import {
    CodeTransform,
    TransformResult,
} from "../../../../lib/api/registration/CodeTransform";

describe("spawnAutofix", () => {

    it("should return a function that runs a command", async () => {
        const p: GitProject = {
            baseDir: ".",
            gitStatus: async () => Promise.resolve({ isClean: true } as GitStatus),
        } as any;
        const a = spawnAutofix("test0", predicatePushTest("ppt4", () => Promise.resolve(true)), undefined,
            { command: "node", args: ["-e", "process.exit(0);"] });
        assert(a.name === "test0");
        assert(a.pushTest.name === "ppt4");
        const r = await (a.transform as CodeTransform)(p, undefined) as TransformResult;
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
            gitStatus: async () => Promise.resolve({ isClean: false } as GitStatus),
        } as any;
        const a = spawnAutofix("test1", predicatePushTest("ppt3", () => Promise.resolve(true)), undefined,
            { command: "node", args: ["-e", "process.exit(0);"] });
        assert(a.name === "test1");
        assert(a.pushTest.name === "ppt3");
        const r = await (a.transform as CodeTransform)(p, undefined) as TransformResult;
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
            gitStatus: async () => Promise.resolve({ isClean: true } as GitStatus),
        } as any;
        const a = spawnAutofix("test2", predicatePushTest("ppt2", () => Promise.resolve(true)), undefined,
            { command: "node", args: ["-e", "process.exit(0);"] },
            { command: "node", args: ["-e", "process.exit(0);"] },
            { command: "node", args: ["-e", "process.exit(0);"] },
        );
        assert(a.name === "test2");
        assert(a.pushTest.name === "ppt2");
        const r = await (a.transform as CodeTransform)(p, undefined) as TransformResult;
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
            gitStatus: async () => Promise.resolve({ isClean: true } as GitStatus),
        } as any;
        const a = spawnAutofix("test3", predicatePushTest("ppt1", () => Promise.resolve(true)), undefined,
            { command: "node", args: ["-e", "process.exit(1);"] });
        assert(a.name === "test3");
        assert(a.pushTest.name === "ppt1");
        const r = await (a.transform as CodeTransform)(p, undefined) as TransformResult;
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
            gitStatus: async () => Promise.resolve({ isClean: false } as GitStatus),
        } as any;
        const a = spawnAutofix("test4", predicatePushTest("ppt0", () => Promise.resolve(true)), undefined,
            { command: "node", args: ["-e", "process.exit(4);"] });
        assert(a.name === "test4");
        assert(a.pushTest.name === "ppt0");
        const r = await (a.transform as CodeTransform)(p, undefined) as TransformResult;
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
            gitStatus: async () => Promise.resolve({ isClean: true } as GitStatus),
        } as any;
        const a = spawnAutofix("test5", predicatePushTest("ppt5", () => Promise.resolve(true)), undefined,
            { command: "node", args: ["-e", "process.exit(2);"] },
            { command: "node", args: ["-e", "process.exit(0);"] },
        );
        assert(a.name === "test5");
        assert(a.pushTest.name === "ppt5");
        const r = await (a.transform as CodeTransform)(p, undefined) as TransformResult;
        assert(r);
        assert(r.target);
        assert(r.success === false);
        assert(r.edited === false);
        assert(r.error);
        assert(r.error.message.endsWith("node '-e' 'process.exit(2);'"));
        assert(r.errorStep === ". ==> node '-e' 'process.exit(2);'");
    });

});
