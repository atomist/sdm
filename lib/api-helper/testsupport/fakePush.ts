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
import { RemoteRepoRef } from "@atomist/automation-client/lib/operations/common/RepoId";
import { GitProject } from "@atomist/automation-client/lib/project/git/GitProject";
import { Project } from "@atomist/automation-client/lib/project/Project";
import { AddressNoChannels } from "../../api/context/addressChannels";
import { NoPreferenceStore } from "../../api/context/preferenceStore";
import { PushListenerInvocation } from "../../api/listener/PushListener";
import { fakeContext } from "./fakeContext";

/**
 * Used for testing
 * @param {Project} project
 * @param {Partial<PushListenerInvocation>} pli
 * @return {PushListenerInvocation}
 */
export function fakePush(project?: Project, pli: Partial<PushListenerInvocation> = {}): PushListenerInvocation {
    return {
        id: project ? project.id as RemoteRepoRef : new GitHubRepoRef("my", "test"),
        push: {
            id: new Date().getTime() + "_",
            branch: "master",
            after: {
                message: "Some fake commit",
            },
        },
        project: project as GitProject,
        context: fakeContext(),
        addressChannels: AddressNoChannels,
        configuration: {},
        preferences: NoPreferenceStore,
        credentials: { token: "fake-token" },
        ...pli,
    };
}
