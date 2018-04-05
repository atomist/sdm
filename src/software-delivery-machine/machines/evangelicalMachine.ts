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

import { whenPushSatisfies } from "../../blueprint/dsl/goalDsl";
import { SoftwareDeliveryMachine, SoftwareDeliveryMachineOptions } from "../../blueprint/SoftwareDeliveryMachine";
import { ToDefaultBranch } from "../../common/listener/support/pushtest/commonPushTests";
import { IsMaven } from "../../common/listener/support/pushtest/jvm/jvmPushTests";
import { MaterialChangeToJavaRepo } from "../../common/listener/support/pushtest/jvm/materialChangeToJavaRepo";
import { HasSpringBootApplicationClass } from "../../common/listener/support/pushtest/jvm/springPushTests";
import { not } from "../../common/listener/support/pushtest/pushTestUtils";
import { disableDeploy, enableDeploy } from "../../handlers/commands/SetDeployEnablement";
import { EnableDeployOnCloudFoundryManifestAddition, } from "../blueprint/deploy/cloudFoundryDeploy";
import { suggestAddingCloudFoundryManifest } from "../blueprint/repo/suggestAddingCloudFoundryManifest";
import { addCloudFoundryManifest } from "../commands/editors/pcf/addCloudFoundryManifest";
import { nodeTagger } from "@atomist/spring-automation/commands/tag/nodeTagger";
import { tagRepo } from "../../common/listener/support/tagRepo";
import { springBootTagger } from "@atomist/spring-automation/commands/tag/springTagger";
import { isMessageGoal, MessageGoal } from "../../common/delivery/goals/common/MessageGoal";
import { addDemoEditors } from "../parts/demo/demoEditors";

export type EvangelicalMachineOptions = SoftwareDeliveryMachineOptions;

/**
 * Assemble a machine that suggests greater use of Atomist
 */
export function evangelicalMachine(options: EvangelicalMachineOptions): SoftwareDeliveryMachine {
    const sdm = new SoftwareDeliveryMachine(
        "Helpful software delivery machine. You need to be saved.",
        options,
        whenPushSatisfies(IsMaven, HasSpringBootApplicationClass, not(MaterialChangeToJavaRepo))
            .itMeans("No material change to Java")
            .setGoals(new MessageGoal("Look like your push didn't change Java. Maybe we don't need to build this. Atomist could help.")),
        whenPushSatisfies(ToDefaultBranch, IsMaven, HasSpringBootApplicationClass)
            .itMeans("Spring Boot service to deploy")
            .setGoals(new MessageGoal("You're working on a Spring Boot repo. Atomist knows lots about Spring Boot and would love to help")),
        // whenPushSatisfies(IsMaven)
        //     .itMeans("Build Java")
        //     .setGoals(LibraryGoals),
        // whenPushSatisfies(IsNode)
        //     .itMeans("Build with npm")
        //     .setGoals(NpmBuildGoals),
    );

    sdm.addGoalsSetListeners(async gs => {
        return Promise.all(gs.goalSet.goals
            .filter(isMessageGoal)
            .map(goal => gs.addressChannels(goal.message)));
    })
        .addNewRepoWithCodeActions(
            suggestAddingCloudFoundryManifest,
            // TODO suggest creating with Spring
            tagRepo(springBootTagger),
            tagRepo(nodeTagger),
        )
        .addSupportingCommands(
            () => addCloudFoundryManifest,
            () => enableDeploy(),
            () => disableDeploy(),
        )
        .addCodeReactions(EnableDeployOnCloudFoundryManifestAddition);

    //addTeamPolicies(sdm);
    addDemoEditors(sdm);
    return sdm;
}
