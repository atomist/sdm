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

import { HandlerContext, Success } from "@atomist/automation-client";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { InMemoryProject } from "@atomist/automation-client/project/mem/InMemoryProject";

import * as assert from "power-assert";
import { whenPushSatisfies } from "../../src/blueprint/dsl/goalDsl";
import { SoftwareDeliveryMachine, SoftwareDeliveryMachineOptions } from "../../src/blueprint/SoftwareDeliveryMachine";
import { AutofixGoal } from "../../src/common/delivery/goals/common/commonGoals";
import { Goal } from "../../src/common/delivery/goals/Goal";
import { Goals } from "../../src/common/delivery/goals/Goals";
import { AnyPush } from "../../src/common/listener/support/pushtest/commonPushTests";
import { determineGoals } from "../../src/handlers/events/delivery/goals/SetGoalsOnPush";
import { PushFields } from "../../src/typings/types";
import { SingleProjectLoader } from "../common/SingleProjectLoader";

const favoriteRepoRef = GitHubRepoRef.from({
    owner: "jess",
    repo: "monet",
    sha: "75132357b19889c4d6c2bef99fce8f477e1f2196",
    branch: "claude",
});
const fakeSoftwareDeliveryMachineOptions = {
    projectLoader: new SingleProjectLoader(InMemoryProject.from(favoriteRepoRef,
        {path: "README.md", content: "read sometthing else"})),
} as any as SoftwareDeliveryMachineOptions;

const credentials: ProjectOperationCredentials = {token: "ab123bbbaaa"};

const fakeContext = {context: {name: "my favorite context "}} as any as HandlerContext;

const aPush = {repo: {org: {provider: {providerId: "myProviderId"}}}} as PushFields.Fragment;

describe("implementing goals in the SDM", () => {

    it("I can ask it to do an autofix", async () => {

        const mySDM = new SoftwareDeliveryMachine("Gustave",
            fakeSoftwareDeliveryMachineOptions,
            whenPushSatisfies(AnyPush)
                .itMeans("autofix the crap out of that thing")
                .setGoals(new Goals("Autofix only", AutofixGoal)));

        const {determinedGoals, goalsToSave} = await determineGoals({
                projectLoader: fakeSoftwareDeliveryMachineOptions.projectLoader,
                goalSetters: mySDM.goalSetters,
                implementationMapping: mySDM.goalFulfillmentMapper,
            }, {
                credentials, id: favoriteRepoRef, context: fakeContext, push: aPush,
                addressChannels: () => Promise.resolve({}),
            },
        );

        assert(determinedGoals.goals.includes(AutofixGoal));

        assert(goalsToSave.length === 1);
        const onlyGoal = goalsToSave[0];

        const myImpl = mySDM.goalFulfillmentMapper.findImplementationBySdmGoal(onlyGoal);

        assert(myImpl.implementationName === "Autofix");
    });

    const customGoal = new Goal({
        uniqueCamelCaseName: "Jerry",
        displayName: "Springer", environment: "1-staging/", orderedName: "1-springer",
    });

    it("I can teach it to do a custom goal", async () => {
        let executed: boolean = false;
        const goalExecutor = async () => {
            executed = true;
            return Success;
        };

        const mySDM = new SoftwareDeliveryMachine("Gustave",
            fakeSoftwareDeliveryMachineOptions,
            whenPushSatisfies(AnyPush)
                .itMeans("cornelius springer")
                .setGoals(new Goals("Springer", customGoal)))
            .addGoalImplementation("Cornelius",
                customGoal,
                goalExecutor,
            );

        const {determinedGoals, goalsToSave} = await determineGoals({
                projectLoader: fakeSoftwareDeliveryMachineOptions.projectLoader,
                goalSetters: mySDM.goalSetters,
                implementationMapping: mySDM.goalFulfillmentMapper,
            }, {
                credentials, id: favoriteRepoRef, context: fakeContext, push: aPush,
                addressChannels: () => Promise.resolve({}),
            },
        );

        assert(determinedGoals.goals.includes(customGoal));

        assert(goalsToSave.length === 1);
        const onlyGoal = goalsToSave[0];

        const myImpl = mySDM.goalFulfillmentMapper.findImplementationBySdmGoal(onlyGoal);

        assert.equal(myImpl.implementationName, "Cornelius");
        await myImpl.goalExecutor(undefined);
        assert(executed);
    });

});
