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

import { HandlerContext } from "@atomist/automation-client/lib/HandlerContext";
import * as assert from "power-assert";
import { SdmGoalEvent } from "../../../lib/api/goal/SdmGoalEvent";
import { DashboardDisplayProgressLog } from "../../../lib/core/log/DashboardDisplayProgressLog";

describe("DashboardDisplayProgressLog", () => {

    const context: HandlerContext = {
        workspaceId: "TeamID",
        correlationId: "CorrelationID",
        messageClient: undefined,
    };

    const goal: SdmGoalEvent = {
        push: {},
        repo: {
            owner: "RepoOwner",
            name: "RepoName",
            providerId: undefined,
        },
        sha: "SHA1",
        environment: "ENV",
        uniqueName: "autofix#machine.ts:141",
        registration: "@atomist/test",
        goalSetId: "2362da01-121c-4637-970c-a5ae7dbf6067",
        branch: undefined,
        name: undefined,
        fulfillment: undefined,
        description: undefined,
        goalSet: undefined,
        state: undefined,
        ts: undefined,
        provenance: undefined,
        preConditions: undefined,
    };

    it("should construct dashboard log URL", () => {
        const log = new DashboardDisplayProgressLog({}, context, goal);
        assert.equal(log.url,
            // tslint:disable-next-line:max-line-length
            "https://app.atomist.com/workspace/TeamID/logs/RepoOwner/RepoName/SHA1/ENV/autofix%23machine.ts%3A141/2362da01-121c-4637-970c-a5ae7dbf6067/CorrelationID");
    });

});
