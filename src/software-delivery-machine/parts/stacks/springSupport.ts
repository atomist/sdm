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
import { SoftwareDeliveryMachine } from "../../../blueprint/SoftwareDeliveryMachine";
import { localDeployment } from "../../../common/delivery/deploy/deployOnLocal";
import { ManagedDeploymentTargeter } from "../../../common/delivery/deploy/local/appManagement";
import { tagRepo } from "../../../common/listener/support/tagRepo";
import { applyHttpServiceGoals } from "../../blueprint/goal/jvmGoalManagement";
import { tryToUpgradeSpringBootVersion } from "../../commands/editors/spring/tryToUpgradeSpringBootVersion";
import { springBootGenerator } from "../../commands/generators/spring/springBootGenerator";

/**
 * Configuration common to Spring SDMs, wherever they deploy
 * @param {SoftwareDeliveryMachine} softwareDeliveryMachine
 * @param {{useCheckstyle: boolean}} opts
 */
export function addSpringSupport(softwareDeliveryMachine: SoftwareDeliveryMachine, opts: { useCheckstyle: boolean }) {
    softwareDeliveryMachine
        .addEditors(
            () => tryToUpgradeSpringBootVersion,
        )
        .addGenerators(() => springBootGenerator({
            seedOwner: "spring-team",
            seedRepo: "spring-rest-seed",
            groupId: "atomist",
            intent: "create spring",
        }))
        .addNewRepoWithCodeActions(
            tagRepo(springBootTagger),
        )
        .addSupportingCommands(() => applyHttpServiceGoals);

    softwareDeliveryMachine
        .addFunctionalUnits(localDeployment(softwareDeliveryMachine.opts.projectLoader, ManagedDeploymentTargeter));
}
