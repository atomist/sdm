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
} from "@atomist/automation-client";
import assert = require("power-assert");
import { DefaultGoalImplementationMapper } from "../../../lib/api-helper/goal/DefaultGoalImplementationMapper";
import { fakePush } from "../../../lib/api-helper/testsupport/fakePush";
import { Goal } from "../../../lib/api/goal/Goal";
import { SdmGoalEvent } from "../../../lib/api/goal/SdmGoalEvent";
import { SdmGoalFulfillmentMethod } from "../../../lib/api/goal/SdmGoalMessage";
import { IndependentOfEnvironment } from "../../../lib/api/goal/support/environment";
import { PushListenerInvocation } from "../../../lib/api/listener/PushListener";
import { AnyPush } from "../../../lib/api/mapping/support/commonPushTests";
import { not } from "../../../lib/api/mapping/support/pushTestUtils";

describe("DefaultGoalImplementationMapper", () => {

    describe("addImplementation", () => {

        it("should not allow to register implementation with same name for same goal", () => {
            const mp = new DefaultGoalImplementationMapper();
            mp.addImplementation({
                implementationName: "test",
                goal: new Goal({
                    uniqueName: "foo",
                    displayName: "bar",
                } as any),
            } as any);

            assert.throws(() => mp.addImplementation({
                implementationName: "test",
                goal: new Goal({
                    uniqueName: "foo",
                    displayName: "bar",
                } as any),
            } as any), /Implementation with name 'test' already registered for goal 'bar'/i);
        });

        it("should allow to register implementation with same name for different goal", () => {
            const mp = new DefaultGoalImplementationMapper();
            mp.addImplementation({
                implementationName: "test",
                goal: new Goal({
                    uniqueName: "foo1",
                    displayName: "bar",
                } as any),
            } as any);

            mp.addImplementation({
                implementationName: "test",
                goal: new Goal({
                    uniqueName: "foo2",
                    displayName: "bar",
                } as any),
            } as any);
        });
    });

    describe("findImplementationBySdmGoal", () => {

        it("should find one goal implementation for goal", () => {
            const mp = new DefaultGoalImplementationMapper();

            const gi = {
                implementationName: "test",
                goal: new Goal({
                    uniqueName: "foo",
                    displayName: "bar",
                    environment: IndependentOfEnvironment,
                } as any),
            };

            mp.addImplementation(gi as any);

            mp.addImplementation({
                implementationName: "test",
                goal: new Goal({
                    uniqueName: "foo2",
                    displayName: "bar",
                } as any),
            } as any);

            const goal: SdmGoalEvent = {
                name: "bar",
                uniqueName: "foo",
                fulfillment: {
                    method: SdmGoalFulfillmentMethod.Sdm,
                    name: "test",
                },
                externalKey: "sdm/atomist/0-code/foo",
            } as any;
            const agi = mp.findImplementationBySdmGoal(goal);
            assert.deepEqual(agi, gi);
        });

        it("should not find goal implementation for goal with unknown fulfillment", () => {
            const mp = new DefaultGoalImplementationMapper();

            const gi = {
                implementationName: "test",
                goal: new Goal({
                    uniqueName: "foo",
                    displayName: "bar",
                    environment: IndependentOfEnvironment,
                } as any),
            };

            mp.addImplementation(gi as any);

            mp.addImplementation({
                implementationName: "test",
                goal: new Goal({
                    uniqueName: "foo2",
                    displayName: "bar",
                } as any),
            } as any);

            const goal: SdmGoalEvent = {
                name: "bar",
                uniqueName: "foo",
                fulfillment: {
                    method: SdmGoalFulfillmentMethod.Sdm,
                    name: "foo",
                },
                externalKey: "sdm/atomist/0-code/foo",
            } as any;
            assert.throws(() => mp.findImplementationBySdmGoal(goal),
                /No implementation found with name 'foo': Found test/i);
        });

    });

    describe("findFulfillmentByPush", () => {

        it("should find single matching goal fulfillment", async () => {
            const mp = new DefaultGoalImplementationMapper();

            const id = new GitHubRepoRef("a", "b");
            const p = InMemoryProject.from(id);
            const pli: PushListenerInvocation = fakePush(p);

            const goal = new Goal({
                uniqueName: "foo1",
                displayName: "bar",
            } as any);

            mp.addImplementation({
                implementationName: "test1",
                goal,
                pushTest: AnyPush,
            } as any);

            mp.addImplementation({
                implementationName: "test2",
                goal,
                pushTest: not(AnyPush),
            } as any);

            mp.addImplementation({
                implementationName: "test1",
                goal: new Goal({
                    uniqueName: "foo2",
                    displayName: "bar",
                } as any),
            } as any);

            const f = await mp.findFulfillmentByPush(goal, pli);
            assert(!!f);
        });

        it("should throw error if more matching fulfillments", async () => {
            const mp = new DefaultGoalImplementationMapper();

            const id = new GitHubRepoRef("a", "b");
            const p = InMemoryProject.from(id);
            const pli: PushListenerInvocation = fakePush(p);

            const goal = new Goal({
                uniqueName: "foo1",
                displayName: "bar",
            } as any);

            mp.addImplementation({
                implementationName: "test1",
                goal,
                pushTest: AnyPush,
            } as any);

            mp.addImplementation({
                implementationName: "test2",
                goal,
                pushTest: AnyPush,
            } as any);

            mp.addImplementation({
                implementationName: "test1",
                goal: new Goal({
                    uniqueName: "foo2",
                    displayName: "bar",
                } as any),
            } as any);

            try {
                await mp.findFulfillmentByPush(goal, pli);
                assert.fail();
            } catch (err) {
                assert.equal(err.message, "Multiple matching implementations for goal 'bar' found: 'test1, test2'");
            }
        });

    });

});
