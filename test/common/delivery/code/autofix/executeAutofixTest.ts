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

import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { InMemoryFile } from "@atomist/automation-client/project/mem/InMemoryFile";
import { InMemoryProject } from "@atomist/automation-client/project/mem/InMemoryProject";

import * as assert from "power-assert";
import { executeAutofixes } from "../../../../../src/common/delivery/code/autofix/executeAutofixes";
import { SingleProjectLoader } from "../../../../../src/util/test/SingleProjectLoader";
import { fakeRunWithLogContext } from "../../../../../src/util/test/fakeRunWithLogContext";
import { AutofixRegistration } from "../../../../../src/common/delivery/code/autofix/AutofixRegistration";
import { IsTypeScript } from "../../../../../src/common/listener/support/pushtest/node/tsPushTests";

const AddThingAutofix: AutofixRegistration = {
    name: "thinger",
    pushTest: IsTypeScript,
    action: async cri => {
        await cri.project.addFile("thing", "1");
        return { edited: true, success: true, target: cri.project};
    },
};

describe("executeAutofixes", () => {

    it("should execute none", async () => {
        const id = new GitHubRepoRef("a", "b");
        const pl = new SingleProjectLoader({ id } as any);
        const r = await executeAutofixes(pl, [])(fakeRunWithLogContext(id));
        assert(r.code === 0);
    });

    it("should execute header adder and find no match", async () => {
        const id = new GitHubRepoRef("a", "b");
        const initialContent = "public class Thing {}";
        const f = new InMemoryFile("src/main/java/Thing.java", initialContent);
        const p = InMemoryProject.from(id, f);
        const pl = new SingleProjectLoader(p);
        const r = await executeAutofixes(pl, [AddThingAutofix])(fakeRunWithLogContext(id));
        assert(r.code === 0);
        assert(p.findFileSync(f.path).getContentSync() === initialContent);
    });

    it("should execute header adder and find a match and add a header", async () => {
        const id = new GitHubRepoRef("a", "b");
        const initialContent = "public class Thing {}";
        const f = new InMemoryFile("src/Thing.ts", initialContent);
        const p = InMemoryProject.from(id, f, { path: "LICENSE", content: "Apache License"});
        (p as any as GitProject).revert = async () => null;
        (p as any as GitProject).gitStatus = async () => ({ isClean: false } as any);
        const pl = new SingleProjectLoader(p);
        const r = await executeAutofixes(pl, [AddThingAutofix])(fakeRunWithLogContext(id));
        assert(r.code === 0);
        assert.equal(p.findFileSync("thing").getContentSync(), "1");
    });

});
