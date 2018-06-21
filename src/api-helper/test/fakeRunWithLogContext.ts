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

import { logger } from "@atomist/automation-client";
import { RemoteRepoRef, RepoId } from "@atomist/automation-client/operations/common/RepoId";
import { LoggingProgressLog } from "../../api-helper/log/LoggingProgressLog";
import { RunWithLogContext } from "../../api/goal/ExecuteGoalWithLog";
import { StatusForExecuteGoal, StatusState } from "../../typings/types";
import { fakeContext } from "./fakeContext";

/**
 * Useful testing support
 * @param {RemoteRepoRef} id
 * @return {RunWithLogContext}
 */
export function fakeRunWithLogContext(id: RemoteRepoRef): RunWithLogContext {
    return {
        credentials: {token: "foobar"},
        context: fakeContext("T1111"),
        id,
        addressChannels: async m => {
            logger.info("channels > " + m);
        },
        status: fakeStatus(id),
        progressLog: new LoggingProgressLog("fake"),
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
                channels: [ {
                    name: "foo",
                    id: "1",
                    team: {
                        id: "T357",
                    },
                },
                ],
            },
            pushes: [
                {
                    id: "121",
                    branch: "foo",
                },
            ],
        },
    };
}
