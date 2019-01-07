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
import * as assert from "power-assert";
import { toScalarProjectEditor } from "../../../lib/api-helper/machine/handlerRegistrations";
import {
    CodeTransform,
    CodeTransformOrTransforms,
} from "../../../lib/api/registration/CodeTransform";

describe("toScalarProjectEditor", () => {

    it("should invoke single transform without parameters", async () => {
        const ct: CodeTransform = async p => p.addFile("foo", "bar");
        const pe = toScalarProjectEditor(ct, {} as any);
        const project = InMemoryProject.of();
        const r = await pe(project);
        assert.notStrictEqual(r.edited, false);
        assert(!!(await project.getFile("foo")));
        assert.strictEqual(await project.totalFileCount(), 1);
    });

    it("should invoke single transform with parameters", async () => {
        const ct: CodeTransform<{ name: string }> = async (p, ci) =>
            p.addFile(ci.parameters.name, "bar");
        const pe = toScalarProjectEditor(ct, {} as any);
        const project = InMemoryProject.of();
        const r = await pe(project, undefined, { name: "tony" });
        assert.notStrictEqual(r.edited, false);
        assert(!!(await project.getFile("tony")));
        assert.strictEqual(await project.totalFileCount(), 1);
    });

    it("should invoke single transform that doesn't return project", async () => {
        const ct: CodeTransform<{ name: string }> = async (p, ci) => {
            await p.addFile(ci.parameters.name, "bar");
        };
        const pe = toScalarProjectEditor(ct, {} as any);
        const project = InMemoryProject.of();
        const r = await pe(project, undefined, { name: "tony" });
        assert.notStrictEqual(r.edited, false);
        assert(!!(await project.getFile("tony")));
        assert.strictEqual(await project.totalFileCount(), 1);
    });

    it("should invoke multiple transforms that doesn't return project", async () => {
        const ct: CodeTransformOrTransforms<{ name: string }> = [
            async (p, ci) =>
                p.addFile(ci.parameters.name, "bar"),
            async p =>
                p.addFile("foo", "bar"),
        ];
        const pe = toScalarProjectEditor(ct, {} as any);
        const project = InMemoryProject.of();
        const r = await pe(project, undefined, { name: "tony" });
        assert.notStrictEqual(r.edited, false);
        assert(!!(await project.getFile("foo")));
        assert(!!(await project.getFile("tony")));
        assert.strictEqual(await project.totalFileCount(), 2);
    });

});
