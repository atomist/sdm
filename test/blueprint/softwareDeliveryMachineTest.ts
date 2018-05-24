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

import { InMemoryFile } from "@atomist/automation-client/project/mem/InMemoryFile";
import { InMemoryProject } from "@atomist/automation-client/project/mem/InMemoryProject";
import { toFactory } from "@atomist/automation-client/util/constructionUtils";
import * as assert from "power-assert";
import { when } from "../../src/blueprint/dsl/buildDsl";
import { npmCustomBuilder } from "../../src/common/delivery/build/local/npm/NpmDetectBuildMapping";
import { HttpServiceGoals } from "../../src/common/delivery/goals/common/httpServiceGoals";
import { GoalsSetListener } from "../../src/common/listener/GoalsSetListener";
import { HasAtomistBuildFile } from "../../src/common/listener/support/pushtest/node/nodePushTests";
import { SetGoalsOnPush } from "../../src/handlers/events/delivery/goals/SetGoalsOnPush";
import { AddThingAutofix } from "../common/delivery/code/autofix/executeAutofixesTest";
import { fakePush } from "./dsl/decisionTreeTest";

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

    describe("can test goal setting", () => {

        it("sets no goals", async () => {
            const sdm = new SoftwareDeliveryMachine("Gustave",
                fakeSoftwareDeliveryMachineOptions,
                whenPushSatisfies(AnyPush)
                    .itMeans("do nothing")
                    .setGoals(null));
            const p = fakePush();
            assert.equal(await sdm.pushMapping.mapping(p), undefined);
        });

        it("sets goals on any push", async () => {
            const sdm = new SoftwareDeliveryMachine("Gustave",
                fakeSoftwareDeliveryMachineOptions,
                whenPushSatisfies(AnyPush)
                    .setGoals(HttpServiceGoals));
            const p = fakePush();
            assert.equal(await sdm.pushMapping.mapping(p), HttpServiceGoals);
        });

        it("sets goals on particular push", async () => {
            const project = InMemoryProject.of(new InMemoryFile("thing", "1"));
            const sdm = new SoftwareDeliveryMachine("Gustave",
                fakeSoftwareDeliveryMachineOptions,
                whenPushSatisfies(async pu => !!await pu.project.getFile("thing"))
                    .setGoals(HttpServiceGoals));
            const p = fakePush(project);
            assert.equal(await sdm.pushMapping.mapping(p), HttpServiceGoals);
        });
    });

    describe("observesOnly", () => {

        it("cannot mutate", async () => {
            const sdm = new SoftwareDeliveryMachine("Gustave",
                fakeSoftwareDeliveryMachineOptions,
                whenPushSatisfies(async pu => !!await pu.project.getFile("thing"))
                    .setGoals(HttpServiceGoals));
            assert(sdm.observesOnly);
        });

        it("has an autofix", async () => {
            const sdm = new SoftwareDeliveryMachine("Gustave",
                fakeSoftwareDeliveryMachineOptions,
                whenPushSatisfies(async pu => !!await pu.project.getFile("thing"))
                    .setGoals(HttpServiceGoals));
            sdm.addAutofixes(AddThingAutofix);
            assert(!sdm.observesOnly);
        });

        it("has a build", async () => {
            const sdm = new SoftwareDeliveryMachine("Gustave",
                fakeSoftwareDeliveryMachineOptions,
                whenPushSatisfies(async pu => !!await pu.project.getFile("thing"))
                    .setGoals(HttpServiceGoals));
            sdm.addBuildRules(when(HasAtomistBuildFile)
                .itMeans("Custom build script")
                .set(npmCustomBuilder(sdm.opts.artifactStore, sdm.opts.projectLoader)));
            assert(!sdm.observesOnly);
        });

        // tslint:disable:no-unused-expression
        it("has a deployment").pending;
    });

});
