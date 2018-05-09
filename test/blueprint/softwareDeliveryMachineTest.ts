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

import { whenPushSatisfies } from "../../src/blueprint/dsl/goalDsl";
import { SoftwareDeliveryMachine } from "../../src/blueprint/SoftwareDeliveryMachine";
import { NoGoals } from "../../src/common/delivery/goals/common/commonGoals";
import { AnyPush } from "../../src/common/listener/support/pushtest/commonPushTests";
import { fakeSoftwareDeliveryMachineOptions } from "./sdmGoalImplementationTest";

import { toFactory } from "@atomist/automation-client/util/constructionUtils";
import * as assert from "power-assert";
import { GoalsSetListener } from "../../src/common/listener/GoalsSetListener";
import { SetGoalsOnPush } from "../../src/handlers/events/delivery/goals/SetGoalsOnPush";

describe("SDM handler creation", () => {

    describe("emits event handlers", () => {

        it("emits goal setter", async () => {
            const sdm = new SoftwareDeliveryMachine("Gustave",
                fakeSoftwareDeliveryMachineOptions,
                whenPushSatisfies(AnyPush)
                    .itMeans("do nothing")
                    .setGoals(NoGoals));
            assert(sdm.eventHandlers.length > 0);
            const sgop = sdm.eventHandlers.map(h => toFactory(h)()).find(h => !!(h as SetGoalsOnPush).goalsListeners) as SetGoalsOnPush;
            assert(sgop.goalsListeners.length >= 0);
        });

        it("emits goal setter with listener", async () => {
            const gl: GoalsSetListener = async () => undefined;
            const sdm = new SoftwareDeliveryMachine("Gustave",
                fakeSoftwareDeliveryMachineOptions,
                whenPushSatisfies(AnyPush)
                    .itMeans("do nothing")
                    .setGoals(NoGoals));
            sdm.addGoalsSetListeners(gl);
            assert(sdm.eventHandlers.length > 0);
            const sgop = sdm.eventHandlers.map(h => toFactory(h)()).find(h => !!(h as SetGoalsOnPush).goalsListeners) as SetGoalsOnPush;
            assert(sgop.goalsListeners.length >= 1);
        });

    });
});
