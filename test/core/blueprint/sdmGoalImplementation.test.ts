/*
 * Copyright © 2020 Atomist, Inc.
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
import { Success } from "@atomist/automation-client/lib/HandlerResult";
import { guid } from "@atomist/automation-client/lib/internal/util/string";
import { GitHubRepoRef } from "@atomist/automation-client/lib/operations/common/GitHubRepoRef";
import { ProjectOperationCredentials } from "@atomist/automation-client/lib/operations/common/ProjectOperationCredentials";
import { InMemoryProject } from "@atomist/automation-client/lib/project/mem/InMemoryProject";
import * as assert from "power-assert";
import { determineGoals } from "../../../lib/api-helper/goal/chooseAndSetGoals";
import { SingleProjectLoader } from "../../../lib/api-helper/testsupport/SingleProjectLoader";
import { NoPreferenceStore } from "../../../lib/api/context/preferenceStore";
import { whenPushSatisfies } from "../../../lib/api/dsl/goalDsl";
import { Autofix } from "../../../lib/api/goal/common/Autofix";
import { Goals } from "../../../lib/api/goal/Goals";
import { GoalWithFulfillment } from "../../../lib/api/goal/GoalWithFulfillment";
import { SdmGoalEvent } from "../../../lib/api/goal/SdmGoalEvent";
import { resetRegistrableManager } from "../../../lib/api/machine/Registerable";
import {
    SoftwareDeliveryMachineConfiguration,
    SoftwareDeliveryMachineOptions,
} from "../../../lib/api/machine/SoftwareDeliveryMachineOptions";
import { AnyPush } from "../../../lib/api/mapping/support/commonPushTests";
import { DefaultRepoRefResolver } from "../../../lib/core/handlers/common/DefaultRepoRefResolver";
import { createSoftwareDeliveryMachine } from "../../../lib/core/machine/machineFactory";
import { PushFields } from "../../../lib/typings/types";

const favoriteRepoRef = GitHubRepoRef.from({
    owner: "jess",
    repo: "monet",
    sha: "75132357b19889c4d6c2bef99fce8f477e1f2196",
    branch: "claude",
});

export const fakeSoftwareDeliveryMachineOptions = {
    projectLoader: new SingleProjectLoader(InMemoryProject.from(favoriteRepoRef,
        { path: "README.md", content: "read something else" })),
} as any as SoftwareDeliveryMachineOptions;

export const fakeSoftwareDeliveryMachineConfiguration: SoftwareDeliveryMachineConfiguration = {
    name: "fakeSoftwareDeliverMachine",
    sdm: fakeSoftwareDeliveryMachineOptions,
};

const credentials: ProjectOperationCredentials = { token: "ab123bbbaaa" };

const fakeContext = { context: { name: "my favorite context " } } as any as HandlerContext;

const aPush: PushFields.Fragment = {
    repo: {
        org: {
            provider: {
                providerId: "myProviderId",
            },
        },
    },
    after: {
        sha: guid(),
    },
    commits: [{
        sha: guid(),
    }],

} as any;

describe("implementing goals in the SDM", () => {

    afterEach(() => {
        resetRegistrableManager();
    });

    it("can autofix", async () => {
        const mySDM = createSoftwareDeliveryMachine(
            { name: "Gustave", configuration: fakeSoftwareDeliveryMachineConfiguration });
        const autofixGoal = new Autofix();
        mySDM.addGoalContributions(whenPushSatisfies(AnyPush)
            .itMeans("autofix the crap out of that thing")
            .setGoals(new Goals("Autofix only", autofixGoal)));

        const { determinedGoals, goalsToSave } = await determineGoals({
                projectLoader: fakeSoftwareDeliveryMachineOptions.projectLoader,
                repoRefResolver: new DefaultRepoRefResolver(),
                goalSetter: mySDM.pushMapping,
                implementationMapping: mySDM.goalFulfillmentMapper,
                enrichGoal: async g => g,
            }, {
                credentials,
                id: favoriteRepoRef,
                context: fakeContext,
                push: aPush,
                addressChannels: async () => {
                    return;
                },
                preferences: NoPreferenceStore,
                configuration: {},
                goalSetId: "hi",
            },
        );

        assert(determinedGoals.goals.some(g => g.name === autofixGoal.name));
        assert.strictEqual(goalsToSave.length, 1);
        const onlyGoal = goalsToSave[0];

        const myImpl = mySDM.goalFulfillmentMapper.findImplementationBySdmGoal(onlyGoal as any as SdmGoalEvent);
        assert(myImpl.implementationName.endsWith(autofixGoal.definition.uniqueName));
    });

    it("I can teach it to do a custom goal", async () => {

        const customGoal = new GoalWithFulfillment({
            uniqueName: "Jerry",
            displayName: "Springer", environment: "1-staging/", orderedName: "1-springer",
        });

        let executed: boolean = false;
        const goalExecutor = async () => {
            executed = true;
            return Success;
        };

        const mySDM = createSoftwareDeliveryMachine(
            { name: "Gustave", configuration: fakeSoftwareDeliveryMachineConfiguration },
            whenPushSatisfies(AnyPush)
                .itMeans("cornelius springer")
                .setGoals(new Goals("Springer", customGoal.with({ goalExecutor, name: "Cornelius" }))));

        const { determinedGoals, goalsToSave } = await determineGoals({
                projectLoader: fakeSoftwareDeliveryMachineOptions.projectLoader,
                repoRefResolver: new DefaultRepoRefResolver(),
                goalSetter: mySDM.pushMapping,
                implementationMapping: mySDM.goalFulfillmentMapper,
                enrichGoal: async g => g,
            }, {
                credentials, id: favoriteRepoRef, context: fakeContext, push: aPush,
                addressChannels: async () => {
                    return;
                },
                preferences: NoPreferenceStore,
                configuration: {},
                goalSetId: "hi",
            },
        );
        assert(determinedGoals.goals.some(g => g.name === customGoal.name));
        assert.strictEqual(goalsToSave.length, 1);
        const onlyGoal = goalsToSave[0];
        const myImpl = mySDM.goalFulfillmentMapper.findImplementationBySdmGoal(onlyGoal as any as SdmGoalEvent);
        assert.strictEqual(myImpl.implementationName, "Cornelius");
        await myImpl.goalExecutor(undefined);
        assert(executed);
    });

});
