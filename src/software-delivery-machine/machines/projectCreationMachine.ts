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

import { nodeTagger } from "@atomist/spring-automation/commands/tag/nodeTagger";
import { springBootTagger } from "@atomist/spring-automation/commands/tag/springTagger";
import { SoftwareDeliveryMachine, SoftwareDeliveryMachineOptions } from "../../blueprint/SoftwareDeliveryMachine";
import { EphemeralLocalArtifactStore } from "../../common/artifact/local/EphemeralLocalArtifactStore";
import { tagRepo } from "../../common/listener/support/tagRepo";
import { CachingProjectLoader } from "../../common/repo/CachingProjectLoader";
import { springBootGenerator } from "../commands/generators/java/spring/springBootGenerator";
import { nodeGenerator } from "../commands/generators/node/nodeGenerator";
import { CommonGeneratorConfig, CommonJavaGeneratorConfig } from "./generatorConfig";

export type ProjectCreationMachineOptions = SoftwareDeliveryMachineOptions;

/**
 * Assemble a machine that performs only project creation and tagging,
 * for Spring/Java and Node.
 * See generatorConfig.ts to customize generation defaults.
 * @return {SoftwareDeliveryMachine}
 */
export function projectCreationMachine(opts: Partial<ProjectCreationMachineOptions> = {}): SoftwareDeliveryMachine {
    const options: ProjectCreationMachineOptions = {
        artifactStore: new EphemeralLocalArtifactStore(),
        projectLoader: new CachingProjectLoader(),
        ...opts,
    };
    const sdm = new SoftwareDeliveryMachine("Project creation machine", options);

    sdm.addGenerators(
        () => springBootGenerator({
            ...CommonJavaGeneratorConfig,
            seedRepo: "spring-rest-seed",
            intent: "create spring",
        }),
        () => nodeGenerator({
            ...CommonGeneratorConfig,
            seedRepo: "typescript-express-seed",
            intent: "create node",
        }),
        () => nodeGenerator({
            ...CommonGeneratorConfig,
            seedRepo: "minimal-node-seed",
            intent: "create minimal node",
        }))
        .addNewRepoWithCodeActions(
            tagRepo(springBootTagger),
            tagRepo(nodeTagger),
        );
    return sdm;
}
