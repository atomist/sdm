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

import { GitHubRepoRef } from "@atomist/automation-client/lib/operations/common/GitHubRepoRef";
import { InMemoryFile } from "@atomist/automation-client/lib/project/mem/InMemoryFile";
import { InMemoryProject } from "@atomist/automation-client/lib/project/mem/InMemoryProject";
import * as assert from "power-assert";
import {
    doWithProject,
    ProjectAwareGoalInvocation,
} from "../../../lib/api-helper/project/withProject";
import { fakeGoalInvocation } from "../../../lib/api-helper/testsupport/fakeGoalInvocation";
import {
    ProjectLoadingParameters,
    WithLoadedProject,
} from "../../../lib/spi/project/ProjectLoader";

describe("withProject", () => {

    describe("doWithProject", () => {

        it("should call action on cloned project", async () => {
            const fgi = fakeGoalInvocation(GitHubRepoRef.from({ owner: "atomist", repo: "sdm" }), {
                projectLoader: {
                    doWithProject<T>(params: ProjectLoadingParameters, wlp: WithLoadedProject<T>): Promise<T> {
                        const p = InMemoryProject.of(new InMemoryFile("foo", "")) as any;
                        return wlp(p);
                    },
                },
            } as any);
            const action = async (gi: ProjectAwareGoalInvocation) => {
                const r = await gi.exec("node", ["-e", "console.log(process.cwd());"]);
                assert(r.stdout === process.cwd() + "\n");
                assert(await gi.project.hasFile("foo"));
                assert.strictEqual(gi.credentials, fgi.credentials);
                return { code: 0 };
            };
            const result: any = await doWithProject(action)(fgi);
            assert.strictEqual(result.code, 0);
        });

    });

});
