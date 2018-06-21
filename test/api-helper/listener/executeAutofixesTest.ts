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

import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { InMemoryFile } from "@atomist/automation-client/project/mem/InMemoryFile";
import { InMemoryProject } from "@atomist/automation-client/project/mem/InMemoryProject";

import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { fileExists } from "@atomist/automation-client/project/util/projectUtils";
import * as assert from "power-assert";
import { executeAutofixes } from "../../../src/api-helper/listener/executeAutofixes";
import { fakeRunWithLogContext } from "../../../src/api-helper/test/fakeRunWithLogContext";
import { SingleProjectLoader } from "../../../src/api-helper/test/SingleProjectLoader";
import { SdmGoal } from "../../../src/api/goal/SdmGoal";
import { PushListenerInvocation } from "../../../src/api/listener/PushListener";
import { pushTest } from "../../../src/api/mapping/PushTest";
import { AutofixRegistration } from "../../../src/api/registration/AutofixRegistration";
import { RepoRefResolver } from "../../../src/spi/repo-ref/RepoRefResolver";
import { CoreRepoFieldsAndChannels, OnPushToAnyBranch, ScmProvider, StatusForExecuteGoal } from "../../../src/typings/types";

export const AddThingAutofix: AutofixRegistration = {
    name: "AddThing",
    pushTest: pushTest(
        "Is TypeScript",
        async (pi: PushListenerInvocation) => fileExists(pi.project, "**/*.ts", () => true),
    ),
    action: async cri => {
        await cri.project.addFile("thing", "1");
        return { edited: true, success: true, target: cri.project };
    },
};

const FakeRepoRefResolver: RepoRefResolver = {
    repoRefFromPush(push: OnPushToAnyBranch.Push): RemoteRepoRef {
        throw new Error("Not implemented");
    },

    providerIdFromPush(push: OnPushToAnyBranch.Push): string | null {
        throw new Error("Not implemented");
    },

    providerIdFromStatus(status: StatusForExecuteGoal.Fragment): string | null {
        throw new Error("Not implemented");
    },

    repoRefFromSdmGoal(sdmGoal: SdmGoal, provider: ScmProvider.ScmProvider): RemoteRepoRef {
        throw new Error("Not implemented");
    },

    toRemoteRepoRef(repo: CoreRepoFieldsAndChannels.Fragment, opts: { sha?: string, branch?: string }): RemoteRepoRef {
        return {
            remoteBase: "unreal",
            providerType: 0,
            url: "not-here",
            cloneUrl() {
                return "nope";
            },
            createRemote() {
                throw new Error("Not implemented");
            },
            setUserConfig() {
                throw new Error("Not implemented");
            },
            raisePullRequest() {
                throw new Error("Not implemented");
            },
            deleteRemote() {
                throw new Error("Not implemented");
            },
            owner: repo.owner,
            repo: repo.name,
            sha: opts.sha,
            branch: opts.branch,
        };
    },

};

describe("executeAutofixes", () => {

    it("should execute none", async () => {
        const id = new GitHubRepoRef("a", "b");
        const pl = new SingleProjectLoader({ id } as any);
        const r = await executeAutofixes(pl,
            [],
            FakeRepoRefResolver)(fakeRunWithLogContext(id));
        assert.equal(r.code, 0);
    });

    it("should execute header adder and find no match", async () => {
        const id = new GitHubRepoRef("a", "b");
        const initialContent = "public class Thing {}";
        const f = new InMemoryFile("src/main/java/Thing.java", initialContent);
        const p = InMemoryProject.from(id, f);
        const pl = new SingleProjectLoader(p);
        const r = await executeAutofixes(pl,
            [AddThingAutofix],
            FakeRepoRefResolver)(fakeRunWithLogContext(id));
        assert.equal(r.code, 0);
        assert.equal(p.findFileSync(f.path).getContentSync(), initialContent);
    });

    it("should execute header adder and find a match and add a header", async () => {
        const id = new GitHubRepoRef("a", "b");
        const initialContent = "public class Thing {}";
        const f = new InMemoryFile("src/Thing.ts", initialContent);
        const p = InMemoryProject.from(id, f, { path: "LICENSE", content: "Apache License" });
        (p as any as GitProject).revert = async () => null;
        (p as any as GitProject).gitStatus = async () => ({ isClean: false } as any);
        const pl = new SingleProjectLoader(p);
        const r = await executeAutofixes(pl,
            [AddThingAutofix],
            FakeRepoRefResolver)(fakeRunWithLogContext(id));
        assert.equal(r.code, 0);
        assert(!!p);
        const foundFile = p.findFileSync("thing");
        assert(!!foundFile);
        assert.equal(foundFile.getContentSync(), "1");
    });

});
