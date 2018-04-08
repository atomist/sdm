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

import { RunWithLogContext } from "../../../../src/common/delivery/deploy/runWithLog";
import { fakeContext } from "../../../software-delivery-machine/FakeContext";
import { RemoteRepoRef, RepoId } from "@atomist/automation-client/operations/common/RepoId";
import { ConsoleProgressLog } from "../../../../src/common/log/progressLogs";
import { StatusForExecuteGoal, StatusState } from "../../../../src/typings/types";

export function fakeRunWithLogContext(id: RemoteRepoRef): RunWithLogContext {
    return {
        credentials: {token: "foobar"},
        context: fakeContext("T1111"),
        id,
        addressChannels: async () => {
        },
        status: fakeStatus(id),
        progressLog: new ConsoleProgressLog(),
    };
}

export function fakeStatus(id: RepoId): StatusForExecuteGoal.Fragment {
    return {
        context: "fake",
        state: StatusState.pending,
        commit: {
            repo: {
                org: {
                    owner: id.owner,
                },
                name: id.repo,
            },
        },
    };
}
