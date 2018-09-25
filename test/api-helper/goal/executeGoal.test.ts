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
    InMemoryProject,
    Success,
} from "@atomist/automation-client";
import * as assert from "power-assert";
import {
    executeGoal,
    prepareGoalInvocation,
} from "../../../lib/api-helper/goal/executeGoal";
import { createEphemeralProgressLog } from "../../../lib/api-helper/log/EphemeralProgressLog";
import { lastLinesLogInterpreter } from "../../../lib/api-helper/log/logInterpreters";
import { fakeContext } from "../../../lib/api-helper/testsupport/fakeContext";
import { SingleProjectLoader } from "../../../lib/api-helper/testsupport/SingleProjectLoader";
import { Goal } from "../../../lib/api/goal/Goal";
import {
    GoalInvocation,
    GoalProjectListenerRegistration,
} from "../../../lib/api/goal/GoalInvocation";
import { NoProgressReport } from "../../../lib/api/goal/progress/ReportProgress";
import { SdmGoalEvent } from "../../../lib/api/goal/SdmGoalEvent";
import { IndependentOfEnvironment } from "../../../lib/api/goal/support/environment";
import { AnyPush } from "../../../lib/api/mapping/support/commonPushTests";
import { WithLoadedProject } from "../../../lib/spi/project/ProjectLoader";

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

describe("executeGoal", () => {

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
                goal: fakeGoal,
                sdmGoal: fakeSdmGoal,
            } as any as GoalInvocation;

            return executeGoal({ projectLoader, goalExecutionListeners: [] },
                {
                    implementationName: "test",
                    goalExecutor: helloWorldGoalExecutor,
                    logInterpreter: lastLinesLogInterpreter("hi"),
                    pushTest: AnyPush,
                    projectListeners: [],
                    progressReporter: NoProgressReport,
                    goal: fakeGoal,
                },
                fakeRWLC)
                .then(async result => {
                    await fakeRWLC.progressLog.close();
                    //   const result = Success;
                    assert.equal(result.code, 0, result.message);
                    assert(fakeRWLC.progressLog.log.includes("Hello world"));
                });
        }).then(done, done);
    });

    describe("prepareGoalInvocation", () => {

        it("should wrap projectLoader and in invoke pre and post hooks", async () => {
            const projectLoader = new SingleProjectLoader(InMemoryProject.of());
            const fakeRWLC = {
                context: fakeContext(),
                credentials: fakeCredentials,
                goal: fakeGoal,
                sdmGoal: fakeSdmGoal,
                progressLog: {
                    write: () => { /** empty */ },
                },
                configuration: {
                    sdm: {
                        projectLoader,
                    },
                },
            } as any as GoalInvocation;

            let count = 0;
            const listener: GoalProjectListenerRegistration = {
                name: "counter",
                listener: async () => {
                    count++;
                },
                pushTest: AnyPush,
            };

            const hooks = [listener, listener];

            let invoked = false;
            const dwp: WithLoadedProject = async () => {
                invoked = true;
            };

            const wgi = prepareGoalInvocation(fakeRWLC, hooks);
            const pl = wgi.configuration.sdm.projectLoader;
            await pl.doWithProject({} as any, dwp);
            assert.equal(count, 4);
            assert(invoked);
        });

    });

});
