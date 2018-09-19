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

import { InMemoryProject } from "@atomist/automation-client";
import * as assert from "assert";
import { CodeTransform, TransformResult } from "../../../lib/api/registration/CodeTransform";
import { chainTransforms } from "../../../lib/api/registration/transformUtils";

describe("transformUtils", () => {

    it("should chain adds", async () => {
        const t1: CodeTransform = async p => p.addFile("foo", "bar");
        const t2: CodeTransform = async p => p.addFile("fizz", "buzz");
        const chained = chainTransforms(t1, t2);
        const project = InMemoryProject.of();
        const r = await chained(project, undefined, undefined) as TransformResult;
        assert(await project.hasFile("foo"));
        assert(await project.hasFile("fizz"));
        assert.strictEqual(r.edited, undefined);
    });

    it("should note edited", async () => {
        const t1: CodeTransform = async p => p.addFile("foo", "bar");
        const t2: CodeTransform = async p => {
            await p.addFile("fizz", "buzz");
            return { target: p, edited: true, success: true };
        };
        const chained = chainTransforms(t1, t2);
        const project = InMemoryProject.of();
        const r = await chained(project, undefined, undefined) as TransformResult;
        assert(await project.hasFile("foo"));
        assert(await project.hasFile("fizz"));
        assert.strictEqual(r.edited, true);
    });
});
