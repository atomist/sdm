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
    GitHubRepoRef,
    InMemoryProject,
    InMemoryProjectFile,
} from "@atomist/automation-client";
import * as assert from "power-assert";
import { doWithProject } from "../../../lib/api-helper/project/withProject";
import { fakeGoalInvocation } from "../../../lib/api-helper/testsupport/fakeGoalInvocation";
import { GoalInvocation } from "../../../lib/api/goal/GoalInvocation";
import {
    ProjectLoadingParameters,
    WithLoadedProject,
} from "../../../lib/spi/project/ProjectLoader";

describe("withProject", () => {

    describe("doWithProject", () => {

        it("should call action on cloned project", async () => {
            const fgi = fakeGoalInvocation(GitHubRepoRef.from({ owner: "atomist", repo: "sdm" }), {
                projectLoader: {
                    doWithProject<T>(params: ProjectLoadingParameters, action: WithLoadedProject<T>): Promise<T> {
                        const p = InMemoryProject.of(new InMemoryProjectFile("foo", "")) as any;
                        return action(p);
                    },
                },
            } as any);
            const action = (gi: GoalInvocation) => (async p => {
                assert(await p.hasFile("foo"));
                assert.strictEqual(gi.credentials, fgi.credentials);
                return { code: 0 };
            });
            const result: any = await doWithProject(action)(fgi);
            assert.strictEqual(result.code, 0);
        });

    });

});
