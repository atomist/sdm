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

import { springBootTagger } from "@atomist/spring-automation/commands/tag/springTagger";
import * as deploy from "../../../blueprint/dsl/deployDsl";
import { SoftwareDeliveryMachine, SoftwareDeliveryMachineOptions } from "../../../blueprint/SoftwareDeliveryMachine";
import { ManagedDeploymentTargeter } from "../../../common/delivery/deploy/local/appManagement";
import { LocalDeploymentGoal, LocalEndpointGoal, LocalUndeploymentGoal } from "../../../common/delivery/goals/common/commonGoals";
import { IsMaven } from "../../../common/listener/support/pushtest/jvm/jvmPushTests";
import { tagRepo } from "../../../common/listener/support/tagRepo";
import { listLocalDeploys } from "../../../handlers/commands/listLocalDeploys";
import { mavenSourceDeployer } from "../../blueprint/deploy/localSpringBootDeployOnSuccessStatus";
import { tryToUpgradeSpringBootVersion } from "../../commands/editors/spring/tryToUpgradeSpringBootVersion";
import { springBootGenerator } from "../../commands/generators/java/spring/springBootGenerator";
import { CommonJavaGeneratorConfig } from "../../machines/generatorConfig";

/**
 * Configuration common to Spring SDMs, wherever they deploy
 * @param {SoftwareDeliveryMachine} softwareDeliveryMachine
 * @param {{useCheckstyle: boolean}} options
 */
export function addSpringSupport(softwareDeliveryMachine: SoftwareDeliveryMachine, options: SoftwareDeliveryMachineOptions) {
    softwareDeliveryMachine
        .addDeployRules(
            deploy.when(IsMaven)
                .itMeans("Maven local deploy")
                .deployTo(LocalDeploymentGoal, LocalEndpointGoal, LocalUndeploymentGoal)
                .using(
                    {
                        deployer: mavenSourceDeployer(options.projectLoader),
                        targeter: ManagedDeploymentTargeter,
                    },
                ))
        .addSupportingCommands(listLocalDeploys)
        .addEditors(
            () => tryToUpgradeSpringBootVersion,
        )
        .addGenerators(() => springBootGenerator({
            ...CommonJavaGeneratorConfig,
            seedRepo: "spring-rest-seed",
            intent: "create spring",
        }))
        .addNewRepoWithCodeActions(
            tagRepo(springBootTagger),
        );
}
