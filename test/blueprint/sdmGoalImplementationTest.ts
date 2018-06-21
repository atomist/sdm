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

import { HandlerContext, Success } from "@atomist/automation-client";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { InMemoryProject } from "@atomist/automation-client/project/mem/InMemoryProject";

import * as assert from "power-assert";
import { determineGoals } from "../../src/api-helper/goal/chooseAndSetGoals";
import { SingleProjectLoader } from "../../src/api-helper/test/SingleProjectLoader";
import { whenPushSatisfies } from "../../src/api/dsl/goalDsl";
import { Goal } from "../../src/api/goal/Goal";
import { Goals } from "../../src/api/goal/Goals";
import {
    SoftwareDeliveryMachineConfiguration,
    SoftwareDeliveryMachineOptions,
} from "../../src/api/machine/SoftwareDeliveryMachineOptions";
import { AutofixGoal } from "../../src/api/machine/wellKnownGoals";
import { AnyPush } from "../../src/api/mapping/support/commonPushTests";
import { DefaultRepoRefResolver } from "../../src/handlers/common/DefaultRepoRefResolver";
import { createSoftwareDeliveryMachine } from "../../src/machine/machineFactory";
import { PushFields } from "../../src/typings/types";

const favoriteRepoRef = GitHubRepoRef.from({
    owner: "jess",
    repo: "monet",
    sha: "75132357b19889c4d6c2bef99fce8f477e1f2196",
    branch: "claude",
});

export const fakeSoftwareDeliveryMachineOptions = {
    projectLoader: new SingleProjectLoader(InMemoryProject.from(favoriteRepoRef,
        {path: "README.md", content: "read something else"})),
} as any as SoftwareDeliveryMachineOptions;

export const fakeSoftwareDeliveryMachineConfiguration: SoftwareDeliveryMachineConfiguration = {
    sdm: fakeSoftwareDeliveryMachineOptions,
};

const credentials: ProjectOperationCredentials = {token: "ab123bbbaaa"};

const fakeContext = {context: {name: "my favorite context "}} as any as HandlerContext;

const aPush = {repo: {org: {provider: {providerId: "myProviderId"}}}} as PushFields.Fragment;

describe("implementing goals in the SDM", () => {

    it("can autofix", async () => {
        const mySDM = createSoftwareDeliveryMachine(
            {name: "Gustave", configuration: fakeSoftwareDeliveryMachineConfiguration},
            whenPushSatisfies(AnyPush)
                .itMeans("autofix the crap out of that thing")
                .setGoals(new Goals("Autofix only", AutofixGoal)));

        const {determinedGoals, goalsToSave} = await determineGoals({
                projectLoader: fakeSoftwareDeliveryMachineOptions.projectLoader,
                repoRefResolver: new DefaultRepoRefResolver(),
                goalSetter: mySDM.pushMapping,
                implementationMapping: mySDM.goalFulfillmentMapper,
            }, {
                credentials, id: favoriteRepoRef, context: fakeContext, push: aPush,
                addressChannels: () => Promise.resolve({}),
                goalSetId: "hi",
            },
        );

        assert(determinedGoals.goals.includes(AutofixGoal));
        assert.equal(goalsToSave.length, 1);
        const onlyGoal = goalsToSave[0];

        const myImpl = mySDM.goalFulfillmentMapper.findImplementationBySdmGoal(onlyGoal);
        assert.equal(myImpl.implementationName, "Autofix");
    });

    const customGoal = new Goal({
        uniqueName: "Jerry",
        displayName: "Springer", environment: "1-staging/", orderedName: "1-springer",
    });

    it("I can teach it to do a custom goal", async () => {
        let executed: boolean = false;
        const goalExecutor = async () => {
            executed = true;
            return Success;
        };

        const mySDM = createSoftwareDeliveryMachine(
            {name: "Gustave", configuration: fakeSoftwareDeliveryMachineConfiguration},
            whenPushSatisfies(AnyPush)
                .itMeans("cornelius springer")
                .setGoals(new Goals("Springer", customGoal)))
            .addGoalImplementation("Cornelius",
                customGoal,
                goalExecutor,
            );

        const {determinedGoals, goalsToSave} = await determineGoals({
                projectLoader: fakeSoftwareDeliveryMachineOptions.projectLoader,
                repoRefResolver: new DefaultRepoRefResolver(),
                goalSetter: mySDM.pushMapping,
                implementationMapping: mySDM.goalFulfillmentMapper,
            }, {
                credentials, id: favoriteRepoRef, context: fakeContext, push: aPush,
                addressChannels: () => Promise.resolve({}),
                goalSetId: "hi",
            },
        );

        assert(determinedGoals.goals.includes(customGoal));
        assert.equal(goalsToSave.length, 1);
        const onlyGoal = goalsToSave[0];
        const myImpl = mySDM.goalFulfillmentMapper.findImplementationBySdmGoal(onlyGoal);
        assert.equal(myImpl.implementationName, "Cornelius");
        await myImpl.goalExecutor(undefined);
        assert(executed);
    });

});
