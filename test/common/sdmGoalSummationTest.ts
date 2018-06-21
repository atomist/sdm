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

// tslint:disable:max-file-line-count

import * as assert from "power-assert";
import { goalKeyEquals } from "../../src/api-helper/goal/sdmGoal";
import { SdmGoal } from "../../src/api/goal/SdmGoal";
import { sumSdmGoalEventsByOverride } from "../../src/handlers/events/delivery/goals/RequestDownstreamGoalsOnGoalSuccess";

describe("Putting SdmGoal events together", () => {
   it("Lets the event we just received override out-of-date query results", () => {
       const successfulSdmGoal = successEvent.data.SdmGoal[0] as SdmGoal;
       const result = sumSdmGoalEventsByOverride(queryResult.SdmGoal as any as SdmGoal[],
           [successfulSdmGoal]);

       assert.equal(result.length, queryResult.SdmGoal.length);
       const statusOfInterest = result.filter(sg => goalKeyEquals(sg, successfulSdmGoal));
       assert.equal(statusOfInterest.length, 1);
       assert.equal(statusOfInterest[0].state, "success");
   });
});

const successEvent = {
    data: {
        SdmGoal: [{
            externalKey: "sdm/atomist/0-code/0.2-autofix",
            description: "Autofixes OK", preConditions: [], name: "autofix", goalSet: "HTTP Service",
            state: "success",
            ts: 1522981779513,
            fulfillment: {method: "SDM fulfill on requested", name: "Autofix"},
            url: null, provenance: [{
                correlationId: "a54666c9-18e6-4259-a097-faed328275d4",
                name: "OnAnyRequestedSdmGoal", registration: "@atomist/github-sdm",
                ts: 1522981779513, version: "0.2.0",
            },
                {
                    correlationId: "a54666c9-18e6-4259-a097-faed328275d4",
                    name: "SetGoalsOnPush",
                    registration: "@atomist/github-sdm", ts: 1522981774110, version: "0.2.0",
                }],
            environment: "0-code",
            repo: {name: "losgatos1", owner: "satellite-of-love", providerId: "zjlmxjzwhurspem"},
            branch: "master", sha: "3523cd4fa9a1de6175af7364f3b6d3913a67f784",
        }],
    },
    extensions: {
        operationName: "RequestDownstreamGoalsOnGoalSuccess",
        team_id: "T1JVCMVH7",
        team_name: "satellite-of-love",
        correlation_id: "a54666c9-18e6-4259-a097-faed328275d4",
    },
};

const queryResult = {
    SdmGoal: [
        {
            repo: {
                name: "losgatos1",
                owner: "satellite-of-love",
                providerId: "zjlmxjzwhurspem",
            },
            goalSet: "HTTP Service",
            environment: "1-staging",
            name: "deploy to Test",
            sha: "3523cd4fa9a1de6175af7364f3b6d3913a67f784",
            branch: "master",
            state: "planned",
            fulfillment: {
                method: "SDM fulfill on requested",
                name: "Maven test",
            },
            description: "Planning to deploy to Test",
            url: null,
            externalKey: "sdm/atomist/1-staging/3-deploy",
            ts: 1522981774111,
            preConditions: [
                {
                    goalSet: "HTTP Service",
                    environment: "0-code",
                    name: "store artifact",
                },
            ],
            provenance: [
                {
                    registration: "@atomist/github-sdm",
                    version: "0.2.0",
                    name: "SetGoalsOnPush",
                    correlationId: "a54666c9-18e6-4259-a097-faed328275d4",
                    ts: 1522981774111,
                },
            ],
        },
        {
            repo: {
                name: "losgatos1",
                owner: "satellite-of-love",
                providerId: "zjlmxjzwhurspem",
            },
            goalSet: "HTTP Service",
            environment: "1-staging",
            name: "verify Test deployment",
            sha: "3523cd4fa9a1de6175af7364f3b6d3913a67f784",
            branch: "master",
            state: "planned",
            fulfillment: {
                method: "SDM fulfill on requested",
                name: "VerifyInStaging",
            },
            description: "Planning to verify Test deployment",
            url: null,
            externalKey: "sdm/atomist/1-staging/5-verifyEndpoint",
            ts: 1522981774110,
            preConditions: [
                {
                    goalSet: "HTTP Service",
                    environment: "1-staging",
                    name: "locate service endpoint in Test",
                },
            ],
            provenance: [
                {
                    registration: "@atomist/github-sdm",
                    version: "0.2.0",
                    name: "SetGoalsOnPush",
                    correlationId: "a54666c9-18e6-4259-a097-faed328275d4",
                    ts: 1522981774110,
                },
            ],
        },
        {
            repo: {
                name: "losgatos1",
                owner: "satellite-of-love",
                providerId: "zjlmxjzwhurspem",
            },
            goalSet: "HTTP Service",
            environment: "0-code",
            name: "store artifact",
            sha: "3523cd4fa9a1de6175af7364f3b6d3913a67f784",
            branch: "master",
            state: "planned",
            fulfillment: {
                method: "side-effect",
                name: "from ImageLinked",
            },
            description: "Planning to store artifact",
            url: null,
            externalKey: "sdm/atomist/0-code/2.5-artifact",
            ts: 1522981774110,
            preConditions: [
                {
                    goalSet: "HTTP Service",
                    environment: "0-code",
                    name: "build",
                },
            ],
            provenance: [
                {
                    registration: "@atomist/github-sdm",
                    version: "0.2.0",
                    name: "SetGoalsOnPush",
                    correlationId: "a54666c9-18e6-4259-a097-faed328275d4",
                    ts: 1522981774110,
                },
            ],
        },
        {
            repo: {
                name: "losgatos1",
                owner: "satellite-of-love",
                providerId: "zjlmxjzwhurspem",
            },
            goalSet: "HTTP Service",
            environment: "0-code",
            name: "build",
            sha: "3523cd4fa9a1de6175af7364f3b6d3913a67f784",
            branch: "master",
            state: "planned",
            fulfillment: {
                method: "SDM fulfill on requested",
                name: "On any push",
            },
            description: "Planning to build",
            url: null,
            externalKey: "sdm/atomist/0-code/2-build",
            ts: 1522981774114,
            preConditions: [
                {
                    goalSet: "HTTP Service",
                    environment: "0-code",
                    name: "autofix",
                },
            ],
            provenance: [
                {
                    registration: "@atomist/github-sdm",
                    version: "0.2.0",
                    name: "SetGoalsOnPush",
                    correlationId: "a54666c9-18e6-4259-a097-faed328275d4",
                    ts: 1522981774114,
                },
            ],
        },
        {
            repo: {
                name: "losgatos1",
                owner: "satellite-of-love",
                providerId: "zjlmxjzwhurspem",
            },
            goalSet: "HTTP Service",
            environment: "0-code",
            name: "fingerprint",
            sha: "3523cd4fa9a1de6175af7364f3b6d3913a67f784",
            branch: "master",
            state: "in_process",
            fulfillment: {
                method: "SDM fulfill on requested",
                name: "FingerprinterRegistration",
            },
            description: "Working: fingerprint",
            url: null,
            externalKey: "sdm/atomist/0-code/0.1-fingerprint",
            ts: 1522981777109,
            preConditions: [],
            provenance: [
                {
                    registration: "@atomist/github-sdm",
                    version: "0.2.0",
                    name: "OnAnyRequestedSdmGoal",
                    correlationId: "a54666c9-18e6-4259-a097-faed328275d4",
                    ts: 1522981777109,
                },
                {
                    registration: "@atomist/github-sdm",
                    version: "0.2.0",
                    name: "SetGoalsOnPush",
                    correlationId: "a54666c9-18e6-4259-a097-faed328275d4",
                    ts: 1522981774110,
                },
            ],
        },
        {
            repo: {
                name: "losgatos1",
                owner: "satellite-of-love",
                providerId: "zjlmxjzwhurspem",
            },
            goalSet: "HTTP Service",
            environment: "0-code",
            name: "review",
            sha: "3523cd4fa9a1de6175af7364f3b6d3913a67f784",
            branch: "master",
            state: "success",
            fulfillment: {
                method: "SDM fulfill on requested",
                name: "Reviews",
            },
            description: "Code review passed",
            url: null,
            externalKey: "sdm/atomist/0-code/1-review",
            ts: 1522981777149,
            preConditions: [],
            provenance: [
                {
                    registration: "@atomist/github-sdm",
                    version: "0.2.0",
                    name: "OnAnyRequestedSdmGoal",
                    correlationId: "a54666c9-18e6-4259-a097-faed328275d4",
                    ts: 1522981777149,
                },
                {
                    registration: "@atomist/github-sdm",
                    version: "0.2.0",
                    name: "SetGoalsOnPush",
                    correlationId: "a54666c9-18e6-4259-a097-faed328275d4",
                    ts: 1522981774110,
                },
            ],
        },
        {
            repo: {
                name: "losgatos1",
                owner: "satellite-of-love",
                providerId: "zjlmxjzwhurspem",
            },
            goalSet: "HTTP Service",
            environment: "2-prod",
            name: "deploy to Prod",
            sha: "3523cd4fa9a1de6175af7364f3b6d3913a67f784",
            branch: "master",
            state: "planned",
            fulfillment: {
                method: "SDM fulfill on requested",
                name: "Maven production",
            },
            description: "Planning to deploy to Prod",
            url: null,
            externalKey: "sdm/atomist/2-prod/3-prod-deploy",
            ts: 1522981774111,
            preConditions: [
                {
                    goalSet: "HTTP Service",
                    environment: "0-code",
                    name: "store artifact",
                },
                {
                    goalSet: "HTTP Service",
                    environment: "1-staging",
                    name: "verify Test deployment",
                },
            ],
            provenance: [
                {
                    registration: "@atomist/github-sdm",
                    version: "0.2.0",
                    name: "SetGoalsOnPush",
                    correlationId: "a54666c9-18e6-4259-a097-faed328275d4",
                    ts: 1522981774111,
                },
            ],
        },
        {
            repo: {
                name: "losgatos1",
                owner: "satellite-of-love",
                providerId: "zjlmxjzwhurspem",
            },
            goalSet: "HTTP Service",
            environment: "1-staging",
            name: "locate service endpoint in Test",
            sha: "3523cd4fa9a1de6175af7364f3b6d3913a67f784",
            branch: "master",
            state: "planned",
            fulfillment: {
                method: "side-effect",
                name: "deploy to Test",
            },
            description: "Planning to locate service endpoint in Test",
            url: null,
            externalKey: "sdm/atomist/1-staging/4-endpoint",
            ts: 1522981774110,
            preConditions: [
                {
                    goalSet: "HTTP Service",
                    environment: "1-staging",
                    name: "deploy to Test",
                },
            ],
            provenance: [
                {
                    registration: "@atomist/github-sdm",
                    version: "0.2.0",
                    name: "SetGoalsOnPush",
                    correlationId: "a54666c9-18e6-4259-a097-faed328275d4",
                    ts: 1522981774110,
                },
            ],
        },
        {
            repo: {
                name: "losgatos1",
                owner: "satellite-of-love",
                providerId: "zjlmxjzwhurspem",
            },
            goalSet: "HTTP Service",
            environment: "2-prod",
            name: "locate service endpoint in Prod",
            sha: "3523cd4fa9a1de6175af7364f3b6d3913a67f784",
            branch: "master",
            state: "planned",
            fulfillment: {
                method: "side-effect",
                name: "deploy to Prod",
            },
            description: "Planning to locate service endpoint in Prod",
            url: null,
            externalKey: "sdm/atomist/2-prod/4-endpoint",
            ts: 1522981774110,
            preConditions: [
                {
                    goalSet: "HTTP Service",
                    environment: "2-prod",
                    name: "deploy to Prod",
                },
            ],
            provenance: [
                {
                    registration: "@atomist/github-sdm",
                    version: "0.2.0",
                    name: "SetGoalsOnPush",
                    correlationId: "a54666c9-18e6-4259-a097-faed328275d4",
                    ts: 1522981774110,
                },
            ],
        },
        {
            repo: {
                name: "losgatos1",
                owner: "satellite-of-love",
                providerId: "zjlmxjzwhurspem",
            },
            goalSet: "HTTP Service",
            environment: "0-code",
            name: "autofix",
            sha: "3523cd4fa9a1de6175af7364f3b6d3913a67f784",
            branch: "master",
            state: "in_process",
            fulfillment: {
                method: "SDM fulfill on requested",
                name: "Autofix",
            },
            description: "Working: autofix",
            url: null,
            externalKey: "sdm/atomist/0-code/0.2-autofix",
            ts: 1522981777110,
            preConditions: [],
            provenance: [
                {
                    registration: "@atomist/github-sdm",
                    version: "0.2.0",
                    name: "OnAnyRequestedSdmGoal",
                    correlationId: "a54666c9-18e6-4259-a097-faed328275d4",
                    ts: 1522981777110,
                },
                {
                    registration: "@atomist/github-sdm",
                    version: "0.2.0",
                    name: "SetGoalsOnPush",
                    correlationId: "a54666c9-18e6-4259-a097-faed328275d4",
                    ts: 1522981774110,
                },
            ],
        },
        {
            repo: {
                name: "losgatos1",
                owner: "satellite-of-love",
                providerId: "zjlmxjzwhurspem",
            },
            goalSet: "HTTP Service",
            environment: "0-code",
            name: "react",
            sha: "3523cd4fa9a1de6175af7364f3b6d3913a67f784",
            branch: "master",
            state: "in_process",
            fulfillment: {
                method: "SDM fulfill on requested",
                name: "CodeReactions",
            },
            description: "Working: react",
            url: null,
            externalKey: "sdm/atomist/0-code/1.5-react",
            ts: 1522981777110,
            preConditions: [],
            provenance: [
                {
                    registration: "@atomist/github-sdm",
                    version: "0.2.0",
                    name: "OnAnyRequestedSdmGoal",
                    correlationId: "a54666c9-18e6-4259-a097-faed328275d4",
                    ts: 1522981777110,
                },
                {
                    registration: "@atomist/github-sdm",
                    version: "0.2.0",
                    name: "SetGoalsOnPush",
                    correlationId: "a54666c9-18e6-4259-a097-faed328275d4",
                    ts: 1522981774110,
                },
            ],
        },
    ],
};
