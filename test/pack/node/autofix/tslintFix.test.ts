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
import { RemoteRepoRef } from "@atomist/automation-client/lib/operations/common/RepoId";
import { GitCommandGitProject } from "@atomist/automation-client/lib/project/git/GitCommandGitProject";
import { InMemoryFile as InMemoryProjectFile } from "@atomist/automation-client/lib/project/mem/InMemoryFile";
import * as assert from "power-assert";
import { executeAutofixes } from "../../../../lib/api-helper/listener/executeAutofixes";
import { fakeGoalInvocation } from "../../../../lib/api-helper/testsupport/fakeGoalInvocation";
import { SingleProjectLoader } from "../../../../lib/api-helper/testsupport/SingleProjectLoader";
import { DefaultRepoRefResolver } from "../../../../lib/core/handlers/common/DefaultRepoRefResolver";
import { TslintAutofix } from "../../../../lib/pack/node/autofix/typescript/tslintAutofix";

describe("tsLintFix", () => {
    it("should lint and make fixes", async () => {
        const p = await GitCommandGitProject.cloned(
            { token: undefined },
            GitHubRepoRef.from({
                owner: "atomist",
                repo: "tree-path-ts",
                branch: "master",
            }),
        );
        const sha = (await p.gitStatus()).sha;
        // Make commit and push harmless
        p.commit = async () => {
            return p;
        };
        p.push = async () => {
            return p;
        };
        const f = new InMemoryProjectFile("src/bad.ts", "const foo\n\n");
        const pl = new SingleProjectLoader(p);
        // Now mess it up with a lint error
        await p.addFile(f.path, f.content);

        await executeAutofixes([TslintAutofix])(
            fakeGoalInvocation({ ...(p.id as RemoteRepoRef), sha }, {
                projectLoader: pl,
                repoRefResolver: new DefaultRepoRefResolver(),
            } as any),
        );
        const fileNow = p.findFileSync(f.path);
        assert(!!fileNow, "Did not find file: " + f.path);
        const contentNow = fileNow.getContentSync();
        assert(contentNow.startsWith("const foo;"), contentNow);
    }).timeout(90000);
});
