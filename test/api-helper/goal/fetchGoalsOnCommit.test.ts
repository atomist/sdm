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

import * as assert from "power-assert";
import { fetchGoalsFromPush } from "../../../lib/api-helper/goal/fetchGoalsOnCommit";

describe("fetchGoalsOnCommit", () => {

    describe("fetchGoalsFromPush", () => {

        // tslint:disable
        const goal = `{
  "externalKey": "sdm/atomist/0-code/approval-goal",
  "description": "Complete: approval-goal",
  "push": {
    "after": {
      "committer": {
        "login": "cdupuis",
        "person": {
          "chatId": {
            "screenName": "cd"
          },
          "emails": [{
            "address": "cd@atomist.com"
          }],
          "forename": "Christian",
          "gitHubId": {
            "login": "cdupuis"
          },
          "name": "Christian Dupuis",
          "surname": "Dupuis"
        }
      },
      "image": {
        "image": null,
        "imageName": "http:///var/folders/mk/lq59z4j90h18ltcyrnw_dx9r0000gn/T/atm-40941-40941cbCEdwTZerY8/target/cd51-0.1.0-SNAPSHOT.jar/x"
      },
      "message": "Update Cd51Application.java",
      "sha": "ac70626b35fc4873112794544d64aad0a2ae5269",
      "tags": []
    },
    "before": {
      "committer": {
        "login": "cdupuis",
        "person": {
          "chatId": {
            "screenName": "cd"
          },
          "emails": [{
            "address": "cd@atomist.com"
          }],
          "forename": "Christian",
          "gitHubId": {
            "login": "cdupuis"
          },
          "name": "Christian Dupuis",
          "surname": "Dupuis"
        }
      },
      "message": "Update Cd51Application.java",
      "sha": "5572c86d43ca459557c1296bc9ecca2df29d21e4"
    },
    "branch": "master",
    "commits": [{
      "author": {
        "_id": 1093182,
        "login": "cdupuis",
        "name": "Christian Dupuis"
      },
      "message": "Update Cd51Application.java",
      "sha": "ac70626b35fc4873112794544d64aad0a2ae5269",
      "timestamp": "2018-10-25T16:57:50+02:00"
    }],
    "goals": [{
      "externalKey": "sdm/atomist/0-code/autofix#machine.ts:69",
      "description": "Ready: autofix",
      "goalSetId": "c2e95b8a-61a5-4474-95de-7d918d0b5478",
      "preApproval": null,
      "preConditions": [],
      "uniqueName": "autofix#machine.ts:69",
      "name": "autofix",
      "goalSet": "checks, build, deploy",
      "externalUrl": null,
      "phase": null,
      "state": "requested",
      "ts": 1540479475375,
      "fulfillment": {
        "method": "sdm",
        "name": "autofix-autofix#machine.ts:69"
      },
      "url": null,
      "externalUrls": [],
      "provenance": [{
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "SetGoalsOnPush",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479475375,
        "userId": null,
        "version": "1.0.0"
      }],
      "error": null,
      "environment": "0-code",
      "version": 1,
      "preApprovalRequired": false,
      "branch": "master",
      "retryFeasible": false,
      "approvalRequired": false,
      "sha": "ac70626b35fc4873112794544d64aad0a2ae5269",
      "approval": null,
      "data": null
    }, {
      "externalKey": "sdm/atomist/0-code/build#machine.ts:77",
      "description": "Planned: build",
      "goalSetId": "c2e95b8a-61a5-4474-95de-7d918d0b5478",
      "preApproval": null,
      "preConditions": [{
        "environment": "0-code",
        "name": "autofix",
        "uniqueName": "autofix#machine.ts:69"
      }],
      "uniqueName": "build#machine.ts:77",
      "name": "build",
      "goalSet": "checks, build, deploy",
      "externalUrl": null,
      "phase": null,
      "state": "planned",
      "ts": 1540479475376,
      "fulfillment": {
        "method": "sdm",
        "name": "builder#machine.ts:77"
      },
      "url": null,
      "externalUrls": [],
      "provenance": [{
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "SetGoalsOnPush",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479475376,
        "userId": null,
        "version": "1.0.0"
      }],
      "error": null,
      "environment": "0-code",
      "version": 1,
      "preApprovalRequired": false,
      "branch": "master",
      "retryFeasible": true,
      "approvalRequired": false,
      "sha": "ac70626b35fc4873112794544d64aad0a2ae5269",
      "approval": null,
      "data": null
    }, {
      "externalKey": "sdm/atomist/0-code/code-inspection#machine.ts:70",
      "description": "Planned: code inspection",
      "goalSetId": "c2e95b8a-61a5-4474-95de-7d918d0b5478",
      "preApproval": null,
      "preConditions": [{
        "environment": "0-code",
        "name": "autofix",
        "uniqueName": "autofix#machine.ts:69"
      }],
      "uniqueName": "code-inspection#machine.ts:70",
      "name": "code inspection",
      "goalSet": "checks, build, deploy",
      "externalUrl": null,
      "phase": null,
      "state": "planned",
      "ts": 1540479475375,
      "fulfillment": {
        "method": "sdm",
        "name": "code-inspections-code-inspection#machine.ts:70"
      },
      "url": null,
      "externalUrls": [],
      "provenance": [{
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "SetGoalsOnPush",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479475375,
        "userId": null,
        "version": "1.0.0"
      }],
      "error": null,
      "environment": "0-code",
      "version": 1,
      "preApprovalRequired": false,
      "branch": "master",
      "retryFeasible": false,
      "approvalRequired": false,
      "sha": "ac70626b35fc4873112794544d64aad0a2ae5269",
      "approval": null,
      "data": null
    }, {
      "externalKey": "sdm/atomist/0-code/build#machine.ts:77",
      "description": "Building",
      "goalSetId": "c2e95b8a-61a5-4474-95de-7d918d0b5478",
      "preApproval": null,
      "preConditions": [{
        "environment": "0-code",
        "name": "autofix",
        "uniqueName": "autofix#machine.ts:69"
      }],
      "uniqueName": "build#machine.ts:77",
      "name": "build",
      "goalSet": "checks, build, deploy",
      "externalUrl": null,
      "phase": null,
      "state": "in_process",
      "ts": 1540479485159,
      "fulfillment": {
        "method": "sdm",
        "name": "builder#machine.ts:77"
      },
      "url": "https://app.atomist.com/workspace/T8G7LHAUD/logs/sdm-org/cd51/ac70626b35fc4873112794544d64aad0a2ae5269/0-code/build/c2e95b8a-61a5-4474-95de-7d918d0b5478/44a1228a-46c1-4681-aa7e-35d201f6c9e9",
      "externalUrls": [],
      "provenance": [{
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "FulfillGoalOnRequested",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479485159,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "RequestDownstreamGoalsOnGoalSuccess",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479482456,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "SetGoalsOnPush",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479475376,
        "userId": null,
        "version": "1.0.0"
      }],
      "error": null,
      "environment": "0-code",
      "version": 3,
      "preApprovalRequired": false,
      "branch": "master",
      "retryFeasible": true,
      "approvalRequired": false,
      "sha": "ac70626b35fc4873112794544d64aad0a2ae5269",
      "approval": null,
      "data": null
    }, {
      "externalKey": "sdm/atomist/0-code/build#machine.ts:77",
      "description": "Ready: build",
      "goalSetId": "c2e95b8a-61a5-4474-95de-7d918d0b5478",
      "preApproval": null,
      "preConditions": [{
        "environment": "0-code",
        "name": "autofix",
        "uniqueName": "autofix#machine.ts:69"
      }],
      "uniqueName": "build#machine.ts:77",
      "name": "build",
      "goalSet": "checks, build, deploy",
      "externalUrl": null,
      "phase": null,
      "state": "requested",
      "ts": 1540479482456,
      "fulfillment": {
        "method": "sdm",
        "name": "builder#machine.ts:77"
      },
      "url": null,
      "externalUrls": [],
      "provenance": [{
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "RequestDownstreamGoalsOnGoalSuccess",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479482456,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "SetGoalsOnPush",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479475376,
        "userId": null,
        "version": "1.0.0"
      }],
      "error": null,
      "environment": "0-code",
      "version": 2,
      "preApprovalRequired": false,
      "branch": "master",
      "retryFeasible": true,
      "approvalRequired": false,
      "sha": "ac70626b35fc4873112794544d64aad0a2ae5269",
      "approval": null,
      "data": null
    }, {
      "externalKey": "sdm/atomist/0-code/code-inspection#machine.ts:70",
      "description": "Code inspections passed",
      "goalSetId": "c2e95b8a-61a5-4474-95de-7d918d0b5478",
      "preApproval": null,
      "preConditions": [{
        "environment": "0-code",
        "name": "autofix",
        "uniqueName": "autofix#machine.ts:69"
      }],
      "uniqueName": "code-inspection#machine.ts:70",
      "name": "code inspection",
      "goalSet": "checks, build, deploy",
      "externalUrl": null,
      "phase": null,
      "state": "success",
      "ts": 1540479486090,
      "fulfillment": {
        "method": "sdm",
        "name": "code-inspections-code-inspection#machine.ts:70"
      },
      "url": "https://app.atomist.com/workspace/T8G7LHAUD/logs/sdm-org/cd51/ac70626b35fc4873112794544d64aad0a2ae5269/0-code/code inspection/c2e95b8a-61a5-4474-95de-7d918d0b5478/44a1228a-46c1-4681-aa7e-35d201f6c9e9",
      "externalUrls": [],
      "provenance": [{
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "FulfillGoalOnRequested",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479486090,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "RequestDownstreamGoalsOnGoalSuccess",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479482457,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "SetGoalsOnPush",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479475375,
        "userId": null,
        "version": "1.0.0"
      }],
      "error": null,
      "environment": "0-code",
      "version": 4,
      "preApprovalRequired": false,
      "branch": "master",
      "retryFeasible": false,
      "approvalRequired": false,
      "sha": "ac70626b35fc4873112794544d64aad0a2ae5269",
      "approval": null,
      "data": null
    }, {
      "externalKey": "sdm/atomist/0-code/build#machine.ts:77",
      "description": "Building",
      "goalSetId": "c2e95b8a-61a5-4474-95de-7d918d0b5478",
      "preApproval": null,
      "preConditions": [{
        "environment": "0-code",
        "name": "autofix",
        "uniqueName": "autofix#machine.ts:69"
      }],
      "uniqueName": "build#machine.ts:77",
      "name": "build",
      "goalSet": "checks, build, deploy",
      "externalUrl": null,
      "phase": "mvn resources",
      "state": "in_process",
      "ts": 1540479488654,
      "fulfillment": {
        "method": "sdm",
        "name": "builder#machine.ts:77"
      },
      "url": "https://app.atomist.com/workspace/T8G7LHAUD/logs/sdm-org/cd51/ac70626b35fc4873112794544d64aad0a2ae5269/0-code/build/c2e95b8a-61a5-4474-95de-7d918d0b5478/44a1228a-46c1-4681-aa7e-35d201f6c9e9",
      "externalUrls": [],
      "provenance": [{
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "FulfillGoalOnRequested",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479488654,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "RequestDownstreamGoalsOnGoalSuccess",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479482456,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "SetGoalsOnPush",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479475376,
        "userId": null,
        "version": "1.0.0"
      }],
      "error": null,
      "environment": "0-code",
      "version": 5,
      "preApprovalRequired": false,
      "branch": "master",
      "retryFeasible": true,
      "approvalRequired": false,
      "sha": "ac70626b35fc4873112794544d64aad0a2ae5269",
      "approval": null,
      "data": null
    }, {
      "externalKey": "sdm/atomist/0-code/build#machine.ts:77",
      "description": "Building",
      "goalSetId": "c2e95b8a-61a5-4474-95de-7d918d0b5478",
      "preApproval": null,
      "preConditions": [{
        "environment": "0-code",
        "name": "autofix",
        "uniqueName": "autofix#machine.ts:69"
      }],
      "uniqueName": "build#machine.ts:77",
      "name": "build",
      "goalSet": "checks, build, deploy",
      "externalUrl": null,
      "phase": "mvn repackage",
      "state": "in_process",
      "ts": 1540479494568,
      "fulfillment": {
        "method": "sdm",
        "name": "builder#machine.ts:77"
      },
      "url": "https://app.atomist.com/workspace/T8G7LHAUD/logs/sdm-org/cd51/ac70626b35fc4873112794544d64aad0a2ae5269/0-code/build/c2e95b8a-61a5-4474-95de-7d918d0b5478/44a1228a-46c1-4681-aa7e-35d201f6c9e9",
      "externalUrls": [],
      "provenance": [{
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "FulfillGoalOnRequested",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479494568,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "RequestDownstreamGoalsOnGoalSuccess",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479482456,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "SetGoalsOnPush",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479475376,
        "userId": null,
        "version": "1.0.0"
      }],
      "error": null,
      "environment": "0-code",
      "version": 10,
      "preApprovalRequired": false,
      "branch": "master",
      "retryFeasible": true,
      "approvalRequired": false,
      "sha": "ac70626b35fc4873112794544d64aad0a2ae5269",
      "approval": null,
      "data": null
    }, {
      "externalKey": "sdm/atomist/0-code/approval-goal",
      "description": "Start required: approval-goal",
      "goalSetId": "c2e95b8a-61a5-4474-95de-7d918d0b5478",
      "preApproval": null,
      "preConditions": [{
        "environment": "0-code",
        "name": "build",
        "uniqueName": "build#machine.ts:77"
      }],
      "uniqueName": "approval-goal",
      "name": "approval-goal",
      "goalSet": "checks, build, deploy",
      "externalUrl": null,
      "phase": null,
      "state": "waiting_for_pre_approval",
      "ts": 1540479501202,
      "fulfillment": {
        "method": "sdm",
        "name": "approval-goal-executor"
      },
      "url": null,
      "externalUrls": [],
      "provenance": [{
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "RequestDownstreamGoalsOnGoalSuccess",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479501202,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "SetGoalsOnPush",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479475375,
        "userId": null,
        "version": "1.0.0"
      }],
      "error": null,
      "environment": "0-code",
      "version": 2,
      "preApprovalRequired": true,
      "branch": "master",
      "retryFeasible": false,
      "approvalRequired": false,
      "sha": "ac70626b35fc4873112794544d64aad0a2ae5269",
      "approval": null,
      "data": null
    }, {
      "externalKey": "sdm/atomist/0-code/approval-goal",
      "description": "Start required: approval-goal",
      "goalSetId": "c2e95b8a-61a5-4474-95de-7d918d0b5478",
      "preApproval": {
        "channelId": "CDPHFRVLN",
        "correlationId": "b6280159-b887-47d5-b0cf-f51f1d5f7c29",
        "name": "UpdateSdmGoalState",
        "registration": "@atomist/lifecycle-automation",
        "ts": 1540479513822,
        "userId": "cd",
        "version": "0.10.30-master.20181025095554"
      },
      "preConditions": [{
        "environment": "0-code",
        "name": "build",
        "uniqueName": null
      }],
      "uniqueName": "approval-goal",
      "name": "approval-goal",
      "goalSet": "checks, build, deploy",
      "externalUrl": null,
      "phase": null,
      "state": "pre_approved",
      "ts": 1540479513822,
      "fulfillment": {
        "method": "sdm",
        "name": "approval-goal-executor"
      },
      "url": null,
      "externalUrls": [],
      "provenance": [{
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "RequestDownstreamGoalsOnGoalSuccess",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479501202,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "SetGoalsOnPush",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479475375,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": "CDPHFRVLN",
        "correlationId": "b6280159-b887-47d5-b0cf-f51f1d5f7c29",
        "name": "UpdateSdmGoalState",
        "registration": "@atomist/lifecycle-automation",
        "ts": 1540479513822,
        "userId": "cd",
        "version": "0.10.30-master.20181025095554"
      }],
      "error": null,
      "environment": "0-code",
      "version": 3,
      "preApprovalRequired": null,
      "branch": "master",
      "retryFeasible": false,
      "approvalRequired": null,
      "sha": "ac70626b35fc4873112794544d64aad0a2ae5269",
      "approval": null,
      "data": null
    }, {
      "externalKey": "sdm/atomist/0-code/code-inspection#machine.ts:70",
      "description": "Running code inspections",
      "goalSetId": "c2e95b8a-61a5-4474-95de-7d918d0b5478",
      "preApproval": null,
      "preConditions": [{
        "environment": "0-code",
        "name": "autofix",
        "uniqueName": "autofix#machine.ts:69"
      }],
      "uniqueName": "code-inspection#machine.ts:70",
      "name": "code inspection",
      "goalSet": "checks, build, deploy",
      "externalUrl": null,
      "phase": null,
      "state": "in_process",
      "ts": 1540479485045,
      "fulfillment": {
        "method": "sdm",
        "name": "code-inspections-code-inspection#machine.ts:70"
      },
      "url": "https://app.atomist.com/workspace/T8G7LHAUD/logs/sdm-org/cd51/ac70626b35fc4873112794544d64aad0a2ae5269/0-code/code inspection/c2e95b8a-61a5-4474-95de-7d918d0b5478/44a1228a-46c1-4681-aa7e-35d201f6c9e9",
      "externalUrls": [],
      "provenance": [{
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "FulfillGoalOnRequested",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479485045,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "RequestDownstreamGoalsOnGoalSuccess",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479482457,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "SetGoalsOnPush",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479475375,
        "userId": null,
        "version": "1.0.0"
      }],
      "error": null,
      "environment": "0-code",
      "version": 3,
      "preApprovalRequired": false,
      "branch": "master",
      "retryFeasible": false,
      "approvalRequired": false,
      "sha": "ac70626b35fc4873112794544d64aad0a2ae5269",
      "approval": null,
      "data": null
    }, {
      "externalKey": "sdm/atomist/0-code/push-impact#machine.ts:74",
      "description": "Completed push impact analysis",
      "goalSetId": "c2e95b8a-61a5-4474-95de-7d918d0b5478",
      "preApproval": null,
      "preConditions": [{
        "environment": "0-code",
        "name": "autofix",
        "uniqueName": "autofix#machine.ts:69"
      }],
      "uniqueName": "push-impact#machine.ts:74",
      "name": "push impact",
      "goalSet": "checks, build, deploy",
      "externalUrl": null,
      "phase": null,
      "state": "success",
      "ts": 1540479485875,
      "fulfillment": {
        "method": "sdm",
        "name": "push-impact-push-impact#machine.ts:74"
      },
      "url": "https://app.atomist.com/workspace/T8G7LHAUD/logs/sdm-org/cd51/ac70626b35fc4873112794544d64aad0a2ae5269/0-code/push impact/c2e95b8a-61a5-4474-95de-7d918d0b5478/44a1228a-46c1-4681-aa7e-35d201f6c9e9",
      "externalUrls": [],
      "provenance": [{
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "FulfillGoalOnRequested",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479485875,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "RequestDownstreamGoalsOnGoalSuccess",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479482457,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "SetGoalsOnPush",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479475375,
        "userId": null,
        "version": "1.0.0"
      }],
      "error": null,
      "environment": "0-code",
      "version": 4,
      "preApprovalRequired": false,
      "branch": "master",
      "retryFeasible": false,
      "approvalRequired": false,
      "sha": "ac70626b35fc4873112794544d64aad0a2ae5269",
      "approval": null,
      "data": null
    }, {
      "externalKey": "sdm/atomist/0-code/build#machine.ts:77",
      "description": "Building",
      "goalSetId": "c2e95b8a-61a5-4474-95de-7d918d0b5478",
      "preApproval": null,
      "preConditions": [{
        "environment": "0-code",
        "name": "autofix",
        "uniqueName": "autofix#machine.ts:69"
      }],
      "uniqueName": "build#machine.ts:77",
      "name": "build",
      "goalSet": "checks, build, deploy",
      "externalUrl": null,
      "phase": "mvn jar",
      "state": "in_process",
      "ts": 1540479494401,
      "fulfillment": {
        "method": "sdm",
        "name": "builder#machine.ts:77"
      },
      "url": "https://app.atomist.com/workspace/T8G7LHAUD/logs/sdm-org/cd51/ac70626b35fc4873112794544d64aad0a2ae5269/0-code/build/c2e95b8a-61a5-4474-95de-7d918d0b5478/44a1228a-46c1-4681-aa7e-35d201f6c9e9",
      "externalUrls": [],
      "provenance": [{
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "FulfillGoalOnRequested",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479494401,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "RequestDownstreamGoalsOnGoalSuccess",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479482456,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "SetGoalsOnPush",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479475376,
        "userId": null,
        "version": "1.0.0"
      }],
      "error": null,
      "environment": "0-code",
      "version": 9,
      "preApprovalRequired": false,
      "branch": "master",
      "retryFeasible": true,
      "approvalRequired": false,
      "sha": "ac70626b35fc4873112794544d64aad0a2ae5269",
      "approval": null,
      "data": null
    }, {
      "externalKey": "sdm/atomist/1-staging/maven-per-branch-deploy#machine.ts:100",
      "description": "Ready: maven per branch deployment",
      "goalSetId": "c2e95b8a-61a5-4474-95de-7d918d0b5478",
      "preApproval": null,
      "preConditions": [{
        "environment": "0-code",
        "name": "build",
        "uniqueName": "build#machine.ts:77"
      }],
      "uniqueName": "maven-per-branch-deploy#machine.ts:100",
      "name": "maven per branch deployment",
      "goalSet": "checks, build, deploy",
      "externalUrl": null,
      "phase": null,
      "state": "requested",
      "ts": 1540479501203,
      "fulfillment": {
        "method": "sdm",
        "name": "MavenPerBranchDeployment"
      },
      "url": null,
      "externalUrls": [],
      "provenance": [{
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "RequestDownstreamGoalsOnGoalSuccess",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479501203,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "SetGoalsOnPush",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479475375,
        "userId": null,
        "version": "1.0.0"
      }],
      "error": null,
      "environment": "1-staging",
      "version": 2,
      "preApprovalRequired": false,
      "branch": "master",
      "retryFeasible": false,
      "approvalRequired": false,
      "sha": "ac70626b35fc4873112794544d64aad0a2ae5269",
      "approval": null,
      "data": null
    }, {
      "externalKey": "sdm/atomist/1-staging/maven-per-branch-deploy#machine.ts:100",
      "description": "Deployed branch locally",
      "goalSetId": "c2e95b8a-61a5-4474-95de-7d918d0b5478",
      "preApproval": null,
      "preConditions": [{
        "environment": "0-code",
        "name": "build",
        "uniqueName": "build#machine.ts:77"
      }],
      "uniqueName": "maven-per-branch-deploy#machine.ts:100",
      "name": "maven per branch deployment",
      "goalSet": "checks, build, deploy",
      "externalUrl": null,
      "phase": null,
      "state": "success",
      "ts": 1540479508690,
      "fulfillment": {
        "method": "sdm",
        "name": "MavenPerBranchDeployment"
      },
      "url": "https://app.atomist.com/workspace/T8G7LHAUD/logs/sdm-org/cd51/ac70626b35fc4873112794544d64aad0a2ae5269/1-staging/maven per branch deployment/c2e95b8a-61a5-4474-95de-7d918d0b5478/44a1228a-46c1-4681-aa7e-35d201f6c9e9",
      "externalUrls": [{
        "label": "Link",
        "url": "http://127.0.0.1:9090/sdm-org/cd51/master"
      }],
      "provenance": [{
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "FulfillGoalOnRequested",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479508690,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "RequestDownstreamGoalsOnGoalSuccess",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479501203,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "SetGoalsOnPush",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479475375,
        "userId": null,
        "version": "1.0.0"
      }],
      "error": null,
      "environment": "1-staging",
      "version": 4,
      "preApprovalRequired": false,
      "branch": "master",
      "retryFeasible": false,
      "approvalRequired": false,
      "sha": "ac70626b35fc4873112794544d64aad0a2ae5269",
      "approval": null,
      "data": null
    }, {
      "externalKey": "sdm/atomist/0-code/approval-goal",
      "description": "Ready: approval-goal",
      "goalSetId": "c2e95b8a-61a5-4474-95de-7d918d0b5478",
      "preApproval": {
        "channelId": "CDPHFRVLN",
        "correlationId": "b6280159-b887-47d5-b0cf-f51f1d5f7c29",
        "name": "UpdateSdmGoalState",
        "registration": "@atomist/lifecycle-automation",
        "ts": 1540479513822,
        "userId": "cd",
        "version": "0.10.30-master.20181025095554"
      },
      "preConditions": [{
        "environment": "0-code",
        "name": "build",
        "uniqueName": null
      }],
      "uniqueName": "approval-goal",
      "name": "approval-goal",
      "goalSet": "checks, build, deploy",
      "externalUrl": null,
      "phase": null,
      "state": "requested",
      "ts": 1540479516548,
      "fulfillment": {
        "method": "sdm",
        "name": "approval-goal-executor"
      },
      "url": null,
      "externalUrls": [],
      "provenance": [{
        "channelId": null,
        "correlationId": "b6280159-b887-47d5-b0cf-f51f1d5f7c29",
        "name": "VoteOnGoalApprovalRequest",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479516548,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "RequestDownstreamGoalsOnGoalSuccess",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479501202,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "SetGoalsOnPush",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479475375,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": "CDPHFRVLN",
        "correlationId": "b6280159-b887-47d5-b0cf-f51f1d5f7c29",
        "name": "UpdateSdmGoalState",
        "registration": "@atomist/lifecycle-automation",
        "ts": 1540479513822,
        "userId": "cd",
        "version": "0.10.30-master.20181025095554"
      }],
      "error": null,
      "environment": "0-code",
      "version": 4,
      "preApprovalRequired": null,
      "branch": "master",
      "retryFeasible": false,
      "approvalRequired": null,
      "sha": "ac70626b35fc4873112794544d64aad0a2ae5269",
      "approval": null,
      "data": null
    }, {
      "externalKey": "sdm/atomist/0-code/approval-goal",
      "description": "Complete: approval-goal",
      "goalSetId": "c2e95b8a-61a5-4474-95de-7d918d0b5478",
      "preApproval": {
        "channelId": "CDPHFRVLN",
        "correlationId": "b6280159-b887-47d5-b0cf-f51f1d5f7c29",
        "name": "UpdateSdmGoalState",
        "registration": "@atomist/lifecycle-automation",
        "ts": 1540479513822,
        "userId": "cd",
        "version": "0.10.30-master.20181025095554"
      },
      "preConditions": [{
        "environment": "0-code",
        "name": "build",
        "uniqueName": null
      }],
      "uniqueName": "approval-goal",
      "name": "approval-goal",
      "goalSet": "checks, build, deploy",
      "externalUrl": null,
      "phase": null,
      "state": "success",
      "ts": 1540479520012,
      "fulfillment": {
        "method": "sdm",
        "name": "approval-goal-executor"
      },
      "url": "https://app.atomist.com/workspace/T8G7LHAUD/logs/sdm-org/cd51/ac70626b35fc4873112794544d64aad0a2ae5269/0-code/approval-goal/c2e95b8a-61a5-4474-95de-7d918d0b5478/b6280159-b887-47d5-b0cf-f51f1d5f7c29",
      "externalUrls": [{
        "label": "Google",
        "url": "https://google.com"
      }, {
        "label": "Spiegel",
        "url": "https://spiegel.de"
      }],
      "provenance": [{
        "channelId": null,
        "correlationId": "b6280159-b887-47d5-b0cf-f51f1d5f7c29",
        "name": "FulfillGoalOnRequested",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479520012,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "b6280159-b887-47d5-b0cf-f51f1d5f7c29",
        "name": "VoteOnGoalApprovalRequest",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479516548,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "RequestDownstreamGoalsOnGoalSuccess",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479501202,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "SetGoalsOnPush",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479475375,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": "CDPHFRVLN",
        "correlationId": "b6280159-b887-47d5-b0cf-f51f1d5f7c29",
        "name": "UpdateSdmGoalState",
        "registration": "@atomist/lifecycle-automation",
        "ts": 1540479513822,
        "userId": "cd",
        "version": "0.10.30-master.20181025095554"
      }],
      "error": null,
      "environment": "0-code",
      "version": 6,
      "preApprovalRequired": null,
      "branch": "master",
      "retryFeasible": false,
      "approvalRequired": null,
      "sha": "ac70626b35fc4873112794544d64aad0a2ae5269",
      "approval": null,
      "data": null
    }, {
      "externalKey": "sdm/atomist/0-code/approval-goal",
      "description": "Working: approval-goal",
      "goalSetId": "c2e95b8a-61a5-4474-95de-7d918d0b5478",
      "preApproval": {
        "channelId": "CDPHFRVLN",
        "correlationId": "b6280159-b887-47d5-b0cf-f51f1d5f7c29",
        "name": "UpdateSdmGoalState",
        "registration": "@atomist/lifecycle-automation",
        "ts": 1540479513822,
        "userId": "cd",
        "version": "0.10.30-master.20181025095554"
      },
      "preConditions": [{
        "environment": "0-code",
        "name": "build",
        "uniqueName": null
      }],
      "uniqueName": "approval-goal",
      "name": "approval-goal",
      "goalSet": "checks, build, deploy",
      "externalUrl": null,
      "phase": null,
      "state": "in_process",
      "ts": 1540479519475,
      "fulfillment": {
        "method": "sdm",
        "name": "approval-goal-executor"
      },
      "url": "https://app.atomist.com/workspace/T8G7LHAUD/logs/sdm-org/cd51/ac70626b35fc4873112794544d64aad0a2ae5269/0-code/approval-goal/c2e95b8a-61a5-4474-95de-7d918d0b5478/b6280159-b887-47d5-b0cf-f51f1d5f7c29",
      "externalUrls": [],
      "provenance": [{
        "channelId": null,
        "correlationId": "b6280159-b887-47d5-b0cf-f51f1d5f7c29",
        "name": "FulfillGoalOnRequested",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479519475,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "b6280159-b887-47d5-b0cf-f51f1d5f7c29",
        "name": "VoteOnGoalApprovalRequest",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479516548,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "RequestDownstreamGoalsOnGoalSuccess",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479501202,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "SetGoalsOnPush",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479475375,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": "CDPHFRVLN",
        "correlationId": "b6280159-b887-47d5-b0cf-f51f1d5f7c29",
        "name": "UpdateSdmGoalState",
        "registration": "@atomist/lifecycle-automation",
        "ts": 1540479513822,
        "userId": "cd",
        "version": "0.10.30-master.20181025095554"
      }],
      "error": null,
      "environment": "0-code",
      "version": 5,
      "preApprovalRequired": null,
      "branch": "master",
      "retryFeasible": false,
      "approvalRequired": null,
      "sha": "ac70626b35fc4873112794544d64aad0a2ae5269",
      "approval": null,
      "data": null
    }, {
      "externalKey": "sdm/atomist/1-staging/maven-per-branch-deploy#machine.ts:100",
      "description": "Working: maven per branch deployment",
      "goalSetId": "c2e95b8a-61a5-4474-95de-7d918d0b5478",
      "preApproval": null,
      "preConditions": [{
        "environment": "0-code",
        "name": "build",
        "uniqueName": "build#machine.ts:77"
      }],
      "uniqueName": "maven-per-branch-deploy#machine.ts:100",
      "name": "maven per branch deployment",
      "goalSet": "checks, build, deploy",
      "externalUrl": null,
      "phase": null,
      "state": "in_process",
      "ts": 1540479504200,
      "fulfillment": {
        "method": "sdm",
        "name": "MavenPerBranchDeployment"
      },
      "url": "https://app.atomist.com/workspace/T8G7LHAUD/logs/sdm-org/cd51/ac70626b35fc4873112794544d64aad0a2ae5269/1-staging/maven per branch deployment/c2e95b8a-61a5-4474-95de-7d918d0b5478/44a1228a-46c1-4681-aa7e-35d201f6c9e9",
      "externalUrls": [],
      "provenance": [{
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "FulfillGoalOnRequested",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479504200,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "RequestDownstreamGoalsOnGoalSuccess",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479501203,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "SetGoalsOnPush",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479475375,
        "userId": null,
        "version": "1.0.0"
      }],
      "error": null,
      "environment": "1-staging",
      "version": 3,
      "preApprovalRequired": false,
      "branch": "master",
      "retryFeasible": false,
      "approvalRequired": false,
      "sha": "ac70626b35fc4873112794544d64aad0a2ae5269",
      "approval": null,
      "data": null
    }, {
      "externalKey": "sdm/atomist/0-code/build#machine.ts:77",
      "description": "Building",
      "goalSetId": "c2e95b8a-61a5-4474-95de-7d918d0b5478",
      "preApproval": null,
      "preConditions": [{
        "environment": "0-code",
        "name": "autofix",
        "uniqueName": "autofix#machine.ts:69"
      }],
      "uniqueName": "build#machine.ts:77",
      "name": "build",
      "goalSet": "checks, build, deploy",
      "externalUrl": null,
      "phase": "mvn testCompile",
      "state": "in_process",
      "ts": 1540479489662,
      "fulfillment": {
        "method": "sdm",
        "name": "builder#machine.ts:77"
      },
      "url": "https://app.atomist.com/workspace/T8G7LHAUD/logs/sdm-org/cd51/ac70626b35fc4873112794544d64aad0a2ae5269/0-code/build/c2e95b8a-61a5-4474-95de-7d918d0b5478/44a1228a-46c1-4681-aa7e-35d201f6c9e9",
      "externalUrls": [],
      "provenance": [{
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "FulfillGoalOnRequested",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479489662,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "RequestDownstreamGoalsOnGoalSuccess",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479482456,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "SetGoalsOnPush",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479475376,
        "userId": null,
        "version": "1.0.0"
      }],
      "error": null,
      "environment": "0-code",
      "version": 7,
      "preApprovalRequired": false,
      "branch": "master",
      "retryFeasible": true,
      "approvalRequired": false,
      "sha": "ac70626b35fc4873112794544d64aad0a2ae5269",
      "approval": null,
      "data": null
    }, {
      "externalKey": "sdm/atomist/0-code/build#machine.ts:77",
      "description": "Building",
      "goalSetId": "c2e95b8a-61a5-4474-95de-7d918d0b5478",
      "preApproval": null,
      "preConditions": [{
        "environment": "0-code",
        "name": "autofix",
        "uniqueName": "autofix#machine.ts:69"
      }],
      "uniqueName": "build#machine.ts:77",
      "name": "build",
      "goalSet": "checks, build, deploy",
      "externalUrl": null,
      "phase": "post-hook",
      "state": "in_process",
      "ts": 1540479496758,
      "fulfillment": {
        "method": "sdm",
        "name": "builder#machine.ts:77"
      },
      "url": "https://app.atomist.com/workspace/T8G7LHAUD/logs/sdm-org/cd51/ac70626b35fc4873112794544d64aad0a2ae5269/0-code/build/c2e95b8a-61a5-4474-95de-7d918d0b5478/44a1228a-46c1-4681-aa7e-35d201f6c9e9",
      "externalUrls": [],
      "provenance": [{
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "FulfillGoalOnRequested",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479496758,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "RequestDownstreamGoalsOnGoalSuccess",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479482456,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "SetGoalsOnPush",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479475376,
        "userId": null,
        "version": "1.0.0"
      }],
      "error": null,
      "environment": "0-code",
      "version": 11,
      "preApprovalRequired": false,
      "branch": "master",
      "retryFeasible": true,
      "approvalRequired": false,
      "sha": "ac70626b35fc4873112794544d64aad0a2ae5269",
      "approval": null,
      "data": null
    }, {
      "externalKey": "sdm/atomist/0-code/autofix#machine.ts:69",
      "description": "Applying autofixes",
      "goalSetId": "c2e95b8a-61a5-4474-95de-7d918d0b5478",
      "preApproval": null,
      "preConditions": [],
      "uniqueName": "autofix#machine.ts:69",
      "name": "autofix",
      "goalSet": "checks, build, deploy",
      "externalUrl": null,
      "phase": null,
      "state": "in_process",
      "ts": 1540479477696,
      "fulfillment": {
        "method": "sdm",
        "name": "autofix-autofix#machine.ts:69"
      },
      "url": "https://app.atomist.com/workspace/T8G7LHAUD/logs/sdm-org/cd51/ac70626b35fc4873112794544d64aad0a2ae5269/0-code/autofix/c2e95b8a-61a5-4474-95de-7d918d0b5478/44a1228a-46c1-4681-aa7e-35d201f6c9e9",
      "externalUrls": [],
      "provenance": [{
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "FulfillGoalOnRequested",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479477696,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "SetGoalsOnPush",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479475375,
        "userId": null,
        "version": "1.0.0"
      }],
      "error": null,
      "environment": "0-code",
      "version": 2,
      "preApprovalRequired": false,
      "branch": "master",
      "retryFeasible": false,
      "approvalRequired": false,
      "sha": "ac70626b35fc4873112794544d64aad0a2ae5269",
      "approval": null,
      "data": null
    }, {
      "externalKey": "sdm/atomist/0-code/push-impact#machine.ts:74",
      "description": "Running push impact analysis",
      "goalSetId": "c2e95b8a-61a5-4474-95de-7d918d0b5478",
      "preApproval": null,
      "preConditions": [{
        "environment": "0-code",
        "name": "autofix",
        "uniqueName": "autofix#machine.ts:69"
      }],
      "uniqueName": "push-impact#machine.ts:74",
      "name": "push impact",
      "goalSet": "checks, build, deploy",
      "externalUrl": null,
      "phase": null,
      "state": "in_process",
      "ts": 1540479485378,
      "fulfillment": {
        "method": "sdm",
        "name": "push-impact-push-impact#machine.ts:74"
      },
      "url": "https://app.atomist.com/workspace/T8G7LHAUD/logs/sdm-org/cd51/ac70626b35fc4873112794544d64aad0a2ae5269/0-code/push impact/c2e95b8a-61a5-4474-95de-7d918d0b5478/44a1228a-46c1-4681-aa7e-35d201f6c9e9",
      "externalUrls": [],
      "provenance": [{
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "FulfillGoalOnRequested",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479485378,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "RequestDownstreamGoalsOnGoalSuccess",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479482457,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "SetGoalsOnPush",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479475375,
        "userId": null,
        "version": "1.0.0"
      }],
      "error": null,
      "environment": "0-code",
      "version": 3,
      "preApprovalRequired": false,
      "branch": "master",
      "retryFeasible": false,
      "approvalRequired": false,
      "sha": "ac70626b35fc4873112794544d64aad0a2ae5269",
      "approval": null,
      "data": null
    }, {
      "externalKey": "sdm/atomist/0-code/code-inspection#machine.ts:70",
      "description": "Ready: code inspection",
      "goalSetId": "c2e95b8a-61a5-4474-95de-7d918d0b5478",
      "preApproval": null,
      "preConditions": [{
        "environment": "0-code",
        "name": "autofix",
        "uniqueName": "autofix#machine.ts:69"
      }],
      "uniqueName": "code-inspection#machine.ts:70",
      "name": "code inspection",
      "goalSet": "checks, build, deploy",
      "externalUrl": null,
      "phase": null,
      "state": "requested",
      "ts": 1540479482457,
      "fulfillment": {
        "method": "sdm",
        "name": "code-inspections-code-inspection#machine.ts:70"
      },
      "url": null,
      "externalUrls": [],
      "provenance": [{
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "RequestDownstreamGoalsOnGoalSuccess",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479482457,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "SetGoalsOnPush",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479475375,
        "userId": null,
        "version": "1.0.0"
      }],
      "error": null,
      "environment": "0-code",
      "version": 2,
      "preApprovalRequired": false,
      "branch": "master",
      "retryFeasible": false,
      "approvalRequired": false,
      "sha": "ac70626b35fc4873112794544d64aad0a2ae5269",
      "approval": null,
      "data": null
    }, {
      "externalKey": "sdm/atomist/0-code/push-impact#machine.ts:74",
      "description": "Ready: push impact",
      "goalSetId": "c2e95b8a-61a5-4474-95de-7d918d0b5478",
      "preApproval": null,
      "preConditions": [{
        "environment": "0-code",
        "name": "autofix",
        "uniqueName": "autofix#machine.ts:69"
      }],
      "uniqueName": "push-impact#machine.ts:74",
      "name": "push impact",
      "goalSet": "checks, build, deploy",
      "externalUrl": null,
      "phase": null,
      "state": "requested",
      "ts": 1540479482457,
      "fulfillment": {
        "method": "sdm",
        "name": "push-impact-push-impact#machine.ts:74"
      },
      "url": null,
      "externalUrls": [],
      "provenance": [{
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "RequestDownstreamGoalsOnGoalSuccess",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479482457,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "SetGoalsOnPush",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479475375,
        "userId": null,
        "version": "1.0.0"
      }],
      "error": null,
      "environment": "0-code",
      "version": 2,
      "preApprovalRequired": false,
      "branch": "master",
      "retryFeasible": false,
      "approvalRequired": false,
      "sha": "ac70626b35fc4873112794544d64aad0a2ae5269",
      "approval": null,
      "data": null
    }, {
      "externalKey": "sdm/atomist/0-code/approval-goal",
      "description": "Planned: approval-goal",
      "goalSetId": "c2e95b8a-61a5-4474-95de-7d918d0b5478",
      "preApproval": null,
      "preConditions": [{
        "environment": "0-code",
        "name": "build",
        "uniqueName": "build#machine.ts:77"
      }],
      "uniqueName": "approval-goal",
      "name": "approval-goal",
      "goalSet": "checks, build, deploy",
      "externalUrl": null,
      "phase": null,
      "state": "planned",
      "ts": 1540479475375,
      "fulfillment": {
        "method": "sdm",
        "name": "approval-goal-executor"
      },
      "url": null,
      "externalUrls": [],
      "provenance": [{
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "SetGoalsOnPush",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479475375,
        "userId": null,
        "version": "1.0.0"
      }],
      "error": null,
      "environment": "0-code",
      "version": 1,
      "preApprovalRequired": true,
      "branch": "master",
      "retryFeasible": false,
      "approvalRequired": false,
      "sha": "ac70626b35fc4873112794544d64aad0a2ae5269",
      "approval": null,
      "data": null
    }, {
      "externalKey": "sdm/atomist/0-code/build#machine.ts:77",
      "description": "Building",
      "goalSetId": "c2e95b8a-61a5-4474-95de-7d918d0b5478",
      "preApproval": null,
      "preConditions": [{
        "environment": "0-code",
        "name": "autofix",
        "uniqueName": "autofix#machine.ts:69"
      }],
      "uniqueName": "build#machine.ts:77",
      "name": "build",
      "goalSet": "checks, build, deploy",
      "externalUrl": null,
      "phase": "mvn testResources",
      "state": "in_process",
      "ts": 1540479489655,
      "fulfillment": {
        "method": "sdm",
        "name": "builder#machine.ts:77"
      },
      "url": "https://app.atomist.com/workspace/T8G7LHAUD/logs/sdm-org/cd51/ac70626b35fc4873112794544d64aad0a2ae5269/0-code/build/c2e95b8a-61a5-4474-95de-7d918d0b5478/44a1228a-46c1-4681-aa7e-35d201f6c9e9",
      "externalUrls": [],
      "provenance": [{
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "FulfillGoalOnRequested",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479489655,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "RequestDownstreamGoalsOnGoalSuccess",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479482456,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "SetGoalsOnPush",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479475376,
        "userId": null,
        "version": "1.0.0"
      }],
      "error": null,
      "environment": "0-code",
      "version": 6,
      "preApprovalRequired": false,
      "branch": "master",
      "retryFeasible": true,
      "approvalRequired": false,
      "sha": "ac70626b35fc4873112794544d64aad0a2ae5269",
      "approval": null,
      "data": null
    }, {
      "externalKey": "sdm/atomist/0-code/push-impact#machine.ts:74",
      "description": "Planned: push impact",
      "goalSetId": "c2e95b8a-61a5-4474-95de-7d918d0b5478",
      "preApproval": null,
      "preConditions": [{
        "environment": "0-code",
        "name": "autofix",
        "uniqueName": "autofix#machine.ts:69"
      }],
      "uniqueName": "push-impact#machine.ts:74",
      "name": "push impact",
      "goalSet": "checks, build, deploy",
      "externalUrl": null,
      "phase": null,
      "state": "planned",
      "ts": 1540479475375,
      "fulfillment": {
        "method": "sdm",
        "name": "push-impact-push-impact#machine.ts:74"
      },
      "url": null,
      "externalUrls": [],
      "provenance": [{
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "SetGoalsOnPush",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479475375,
        "userId": null,
        "version": "1.0.0"
      }],
      "error": null,
      "environment": "0-code",
      "version": 1,
      "preApprovalRequired": false,
      "branch": "master",
      "retryFeasible": false,
      "approvalRequired": false,
      "sha": "ac70626b35fc4873112794544d64aad0a2ae5269",
      "approval": null,
      "data": null
    }, {
      "externalKey": "sdm/atomist/1-staging/maven-per-branch-deploy#machine.ts:100",
      "description": "Planned: maven per branch deployment",
      "goalSetId": "c2e95b8a-61a5-4474-95de-7d918d0b5478",
      "preApproval": null,
      "preConditions": [{
        "environment": "0-code",
        "name": "build",
        "uniqueName": "build#machine.ts:77"
      }],
      "uniqueName": "maven-per-branch-deploy#machine.ts:100",
      "name": "maven per branch deployment",
      "goalSet": "checks, build, deploy",
      "externalUrl": null,
      "phase": null,
      "state": "planned",
      "ts": 1540479475375,
      "fulfillment": {
        "method": "sdm",
        "name": "MavenPerBranchDeployment"
      },
      "url": null,
      "externalUrls": [],
      "provenance": [{
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "SetGoalsOnPush",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479475375,
        "userId": null,
        "version": "1.0.0"
      }],
      "error": null,
      "environment": "1-staging",
      "version": 1,
      "preApprovalRequired": false,
      "branch": "master",
      "retryFeasible": false,
      "approvalRequired": false,
      "sha": "ac70626b35fc4873112794544d64aad0a2ae5269",
      "approval": null,
      "data": null
    }, {
      "externalKey": "sdm/atomist/0-code/autofix#machine.ts:69",
      "description": "No autofixes applied",
      "goalSetId": "c2e95b8a-61a5-4474-95de-7d918d0b5478",
      "preApproval": null,
      "preConditions": [],
      "uniqueName": "autofix#machine.ts:69",
      "name": "autofix",
      "goalSet": "checks, build, deploy",
      "externalUrl": null,
      "phase": null,
      "state": "success",
      "ts": 1540479479454,
      "fulfillment": {
        "method": "sdm",
        "name": "autofix-autofix#machine.ts:69"
      },
      "url": "https://app.atomist.com/workspace/T8G7LHAUD/logs/sdm-org/cd51/ac70626b35fc4873112794544d64aad0a2ae5269/0-code/autofix/c2e95b8a-61a5-4474-95de-7d918d0b5478/44a1228a-46c1-4681-aa7e-35d201f6c9e9",
      "externalUrls": [],
      "provenance": [{
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "FulfillGoalOnRequested",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479479454,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "SetGoalsOnPush",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479475375,
        "userId": null,
        "version": "1.0.0"
      }],
      "error": null,
      "environment": "0-code",
      "version": 3,
      "preApprovalRequired": false,
      "branch": "master",
      "retryFeasible": false,
      "approvalRequired": false,
      "sha": "ac70626b35fc4873112794544d64aad0a2ae5269",
      "approval": null,
      "data": null
    }, {
      "externalKey": "sdm/atomist/0-code/build#machine.ts:77",
      "description": "Building",
      "goalSetId": "c2e95b8a-61a5-4474-95de-7d918d0b5478",
      "preApproval": null,
      "preConditions": [{
        "environment": "0-code",
        "name": "autofix",
        "uniqueName": "autofix#machine.ts:69"
      }],
      "uniqueName": "build#machine.ts:77",
      "name": "build",
      "goalSet": "checks, build, deploy",
      "externalUrl": null,
      "phase": "pre-hook",
      "state": "in_process",
      "ts": 1540479485161,
      "fulfillment": {
        "method": "sdm",
        "name": "builder#machine.ts:77"
      },
      "url": "https://app.atomist.com/workspace/T8G7LHAUD/logs/sdm-org/cd51/ac70626b35fc4873112794544d64aad0a2ae5269/0-code/build/c2e95b8a-61a5-4474-95de-7d918d0b5478/44a1228a-46c1-4681-aa7e-35d201f6c9e9",
      "externalUrls": [],
      "provenance": [{
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "FulfillGoalOnRequested",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479485161,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "RequestDownstreamGoalsOnGoalSuccess",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479482456,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "SetGoalsOnPush",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479475376,
        "userId": null,
        "version": "1.0.0"
      }],
      "error": null,
      "environment": "0-code",
      "version": 4,
      "preApprovalRequired": false,
      "branch": "master",
      "retryFeasible": true,
      "approvalRequired": false,
      "sha": "ac70626b35fc4873112794544d64aad0a2ae5269",
      "approval": null,
      "data": null
    }, {
      "externalKey": "sdm/atomist/0-code/build#machine.ts:77",
      "description": "Building",
      "goalSetId": "c2e95b8a-61a5-4474-95de-7d918d0b5478",
      "preApproval": null,
      "preConditions": [{
        "environment": "0-code",
        "name": "autofix",
        "uniqueName": "autofix#machine.ts:69"
      }],
      "uniqueName": "build#machine.ts:77",
      "name": "build",
      "goalSet": "checks, build, deploy",
      "externalUrl": null,
      "phase": "mvn test",
      "state": "in_process",
      "ts": 1540479489863,
      "fulfillment": {
        "method": "sdm",
        "name": "builder#machine.ts:77"
      },
      "url": "https://app.atomist.com/workspace/T8G7LHAUD/logs/sdm-org/cd51/ac70626b35fc4873112794544d64aad0a2ae5269/0-code/build/c2e95b8a-61a5-4474-95de-7d918d0b5478/44a1228a-46c1-4681-aa7e-35d201f6c9e9",
      "externalUrls": [],
      "provenance": [{
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "FulfillGoalOnRequested",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479489863,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "RequestDownstreamGoalsOnGoalSuccess",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479482456,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "SetGoalsOnPush",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479475376,
        "userId": null,
        "version": "1.0.0"
      }],
      "error": null,
      "environment": "0-code",
      "version": 8,
      "preApprovalRequired": false,
      "branch": "master",
      "retryFeasible": true,
      "approvalRequired": false,
      "sha": "ac70626b35fc4873112794544d64aad0a2ae5269",
      "approval": null,
      "data": null
    }, {
      "externalKey": "sdm/atomist/0-code/build#machine.ts:77",
      "description": "Build successful",
      "goalSetId": "c2e95b8a-61a5-4474-95de-7d918d0b5478",
      "preApproval": null,
      "preConditions": [{
        "environment": "0-code",
        "name": "autofix",
        "uniqueName": "autofix#machine.ts:69"
      }],
      "uniqueName": "build#machine.ts:77",
      "name": "build",
      "goalSet": "checks, build, deploy",
      "externalUrl": null,
      "phase": "post-hook",
      "state": "success",
      "ts": 1540479497033,
      "fulfillment": {
        "method": "sdm",
        "name": "builder#machine.ts:77"
      },
      "url": "https://app.atomist.com/workspace/T8G7LHAUD/logs/sdm-org/cd51/ac70626b35fc4873112794544d64aad0a2ae5269/0-code/build/c2e95b8a-61a5-4474-95de-7d918d0b5478/44a1228a-46c1-4681-aa7e-35d201f6c9e9",
      "externalUrls": [],
      "provenance": [{
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "FulfillGoalOnRequested",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479497033,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "RequestDownstreamGoalsOnGoalSuccess",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479482456,
        "userId": null,
        "version": "1.0.0"
      }, {
        "channelId": null,
        "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
        "name": "SetGoalsOnPush",
        "registration": "@atomist-seeds/spring-sdm",
        "ts": 1540479475376,
        "userId": null,
        "version": "1.0.0"
      }],
      "error": null,
      "environment": "0-code",
      "version": 12,
      "preApprovalRequired": false,
      "branch": "master",
      "retryFeasible": true,
      "approvalRequired": false,
      "sha": "ac70626b35fc4873112794544d64aad0a2ae5269",
      "approval": null,
      "data": null
    }],
    "id": "T8G7LHAUD_ac70626b35fc4873112794544d64aad0a2ae5269_master",
    "repo": {
      "channels": [{
        "id": "T8G7LHAUD_CDPHFRVLN",
        "name": "cd51",
        "team": {
          "id": "T8G7LHAUD"
        }
      }],
      "defaultBranch": "master",
      "name": "cd51",
      "org": {
        "owner": "sdm-org",
        "ownerType": "organization",
        "provider": {
          "apiUrl": "https://api.github.com/",
          "providerId": "zjlmxjzwhurspem",
          "providerType": "github_com",
          "url": "https://github.com/"
        }
      },
      "owner": "sdm-org"
    },
    "timestamp": "2018-10-25T14:57:51.864Z"
  },
  "goalSetId": "c2e95b8a-61a5-4474-95de-7d918d0b5478",
  "preApproval": {
    "channelId": "CDPHFRVLN",
    "correlationId": "b6280159-b887-47d5-b0cf-f51f1d5f7c29",
    "name": "UpdateSdmGoalState",
    "registration": "@atomist/lifecycle-automation",
    "ts": 1540479513822,
    "userId": "cd",
    "version": "0.10.30-master.20181025095554"
  },
  "preConditions": [{
    "environment": "0-code",
    "name": "build",
    "uniqueName": null
  }],
  "uniqueName": "approval-goal",
  "name": "approval-goal",
  "goalSet": "checks, build, deploy",
  "externalUrl": null,
  "phase": null,
  "state": "success",
  "ts": 1540479520012,
  "fulfillment": {
    "method": "sdm",
    "name": "approval-goal-executor"
  },
  "url": "https://app.atomist.com/workspace/T8G7LHAUD/logs/sdm-org/cd51/ac70626b35fc4873112794544d64aad0a2ae5269/0-code/approval-goal/c2e95b8a-61a5-4474-95de-7d918d0b5478/b6280159-b887-47d5-b0cf-f51f1d5f7c29",
  "externalUrls": [{
    "label": "Google",
    "url": "https://google.com"
  }, {
    "label": "Spiegel",
    "url": "https://spiegel.de"
  }],
  "provenance": [{
    "channelId": null,
    "correlationId": "b6280159-b887-47d5-b0cf-f51f1d5f7c29",
    "name": "FulfillGoalOnRequested",
    "registration": "@atomist-seeds/spring-sdm",
    "ts": 1540479520012,
    "userId": null,
    "version": "1.0.0"
  }, {
    "channelId": null,
    "correlationId": "b6280159-b887-47d5-b0cf-f51f1d5f7c29",
    "name": "VoteOnGoalApprovalRequest",
    "registration": "@atomist-seeds/spring-sdm",
    "ts": 1540479516548,
    "userId": null,
    "version": "1.0.0"
  }, {
    "channelId": null,
    "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
    "name": "RequestDownstreamGoalsOnGoalSuccess",
    "registration": "@atomist-seeds/spring-sdm",
    "ts": 1540479501202,
    "userId": null,
    "version": "1.0.0"
  }, {
    "channelId": null,
    "correlationId": "44a1228a-46c1-4681-aa7e-35d201f6c9e9",
    "name": "SetGoalsOnPush",
    "registration": "@atomist-seeds/spring-sdm",
    "ts": 1540479475375,
    "userId": null,
    "version": "1.0.0"
  }, {
    "channelId": "CDPHFRVLN",
    "correlationId": "b6280159-b887-47d5-b0cf-f51f1d5f7c29",
    "name": "UpdateSdmGoalState",
    "registration": "@atomist/lifecycle-automation",
    "ts": 1540479513822,
    "userId": "cd",
    "version": "0.10.30-master.20181025095554"
  }],
  "error": null,
  "environment": "0-code",
  "version": 6,
  "preApprovalRequired": null,
  "branch": "master",
  "retryFeasible": false,
  "approvalRequired": null,
  "sha": "ac70626b35fc4873112794544d64aad0a2ae5269",
  "approval": null,
  "data": null
}`;

        it("should correctly find goals", () => {
            const goals = fetchGoalsFromPush(JSON.parse(goal));
            assert.strictEqual(goals.length, 6);
            assert(!goals.some(g => !g.push));
            assert(!goals.some(g => g.goalSetId !== JSON.parse(goal).goalSetId));
            assert(goals.some(g => g.uniqueName === "autofix#machine.ts:69"));
            assert(goals.some(g => g.uniqueName === "build#machine.ts:77"));
            assert(goals.some(g => g.uniqueName === "code-inspection#machine.ts:70"));
            assert(goals.some(g => g.uniqueName === "push-impact#machine.ts:74"));
        });
    });

});
