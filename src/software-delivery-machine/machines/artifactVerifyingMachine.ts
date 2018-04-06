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

import * as fs from "fs";
import * as build from "../../blueprint/dsl/buildDsl";
import { whenPushSatisfies } from "../../blueprint/dsl/goalDsl";
import { SoftwareDeliveryMachine, SoftwareDeliveryMachineOptions } from "../../blueprint/SoftwareDeliveryMachine";
import { MavenBuilder } from "../../common/delivery/build/local/maven/MavenBuilder";
import { ArtifactGoal, JustBuildGoal } from "../../common/delivery/goals/common/commonGoals";
import { Goals } from "../../common/delivery/goals/Goals";
import { IsMaven } from "../../common/listener/support/pushtest/jvm/jvmPushTests";
import { createEphemeralProgressLog } from "../../common/log/EphemeralProgressLog";
import { CachingProjectLoader } from "../../common/repo/CachingProjectLoader";
import { DefaultArtifactStore } from "../blueprint/artifactStore";
import { addDemoEditors } from "../parts/demo/demoEditors";

export type ArtifactVerifyingMachineOptions = SoftwareDeliveryMachineOptions;

/**
 * Assemble a machine that only builds and verifies Java artifacts.
 * @return {SoftwareDeliveryMachine}
 */
export function artifactVerifyingMachine(opts: Partial<ArtifactVerifyingMachineOptions> = {}): SoftwareDeliveryMachine {
    const options = {
        artifactStore: DefaultArtifactStore,
        projectLoader: new CachingProjectLoader(),
        ...opts,
    };
    const sdm = new SoftwareDeliveryMachine("Artifact verifying machine", options,
        whenPushSatisfies(IsMaven)
            .itMeans("Push to Maven repo")
            .setGoals(new Goals("Verify artifact", JustBuildGoal, ArtifactGoal)),
            );
    sdm.addBuildRules(
        build.when(IsMaven)
            .itMeans("build with Maven")
            .set(new MavenBuilder(options.artifactStore, createEphemeralProgressLog, options.projectLoader)))
        .addArtifactListeners(async ai => {
            // Could invoke a security scanning tool etc.
            const stat = fs.statSync(`${ai.deployableArtifact.cwd}/${ai.deployableArtifact.filename}`);
            if (stat.size > 1000) {
                return ai.addressChannels(`Artifact \`${ai.deployableArtifact.filename}\` is very big at ${stat.size} :weight_lifter:`);
            }
        });

    addDemoEditors(sdm);
    return sdm;
}
