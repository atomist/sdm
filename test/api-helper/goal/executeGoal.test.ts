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

import { Success } from "@atomist/automation-client";
import { InMemoryProject } from "@atomist/automation-client/project/mem/InMemoryProject";
import * as assert from "power-assert";
import { executeGoal } from "../../../src/api-helper/goal/executeGoal";
import { createEphemeralProgressLog } from "../../../src/api-helper/log/EphemeralProgressLog";
import { lastLinesLogInterpreter } from "../../../src/api-helper/log/logInterpreters";
import { fakeContext } from "../../../src/api-helper/test/fakeContext";
import { SingleProjectLoader } from "../../../src/api-helper/test/SingleProjectLoader";
import { Goal } from "../../../src/api/goal/Goal";
import { GoalInvocation } from "../../../src/api/goal/GoalInvocation";
import { SdmGoalEvent } from "../../../src/api/goal/SdmGoalEvent";
import { IndependentOfEnvironment } from "../../../src/api/goal/support/environment";

const helloWorldGoalExecutor = async (goalInvocation: GoalInvocation) => {
    goalInvocation.progressLog.write("Hello world\n");
    return Success;
};

const fakeGoal = new Goal({
    uniqueName: "HelloWorld",
    environment: IndependentOfEnvironment,
    orderedName: "0-yo",
});

const fakePush = {
    repo: {
        name: "foo",
        owner: "bar",
        org: {
            provider: {
                providerId: "aldkfjdalkfj",
            },
        },
    },
};

const fakeSdmGoal = {
    name: "test",
    fulfillment: { name: "HelloWorld" },
    environment: "0-code",
    push: fakePush,
} as any as SdmGoalEvent;

const fakeCredentials = { token: "NOT-A-TOKEN" };

describe("executing the goal", () => {

    before(() => {
        (global as any).__runningAutomationClient = {
            configuration: {
                goal: {
                    hooks: true,
                },
            },
        };
    });

    after(() => {
        delete (global as any).__runningAutomationClient;
    });

    it("calls a pre-hook and sends output to the log", done => {
        const projectLoader = new SingleProjectLoader(InMemoryProject.of());

        createEphemeralProgressLog(fakeContext(),
            { name: "test" } as SdmGoalEvent).then(progressLog => {
            const fakeRWLC = {
                context: fakeContext(),
                progressLog,
                credentials: fakeCredentials,
            } as any as GoalInvocation;

            return executeGoal({ projectLoader, goalExecutionListeners: [] },
                helloWorldGoalExecutor,
                fakeRWLC,
                fakeSdmGoal,
                fakeGoal,
                lastLinesLogInterpreter("hi"),
                null)
                .then(async result => {
                    await fakeRWLC.progressLog.close();
                    //   const result = Success;
                    assert.equal(result.code, 0, result.message);
                    assert(fakeRWLC.progressLog.log.includes("Hello world"));
                });
        }).then(done, done);
    });

});
