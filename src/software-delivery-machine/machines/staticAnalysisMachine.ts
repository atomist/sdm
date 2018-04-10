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

import { ProjectReviewer } from "@atomist/automation-client/operations/review/projectReviewer";
import { DefaultReviewComment } from "@atomist/automation-client/operations/review/ReviewResult";
import { saveFromFiles } from "@atomist/automation-client/project/util/projectUtils";
import { whenPushSatisfies } from "../../blueprint/dsl/goalDsl";
import { SoftwareDeliveryMachine, SoftwareDeliveryMachineOptions } from "../../blueprint/SoftwareDeliveryMachine";
import { EphemeralLocalArtifactStore } from "../../common/artifact/local/EphemeralLocalArtifactStore";
import { ReviewGoal } from "../../common/delivery/goals/common/commonGoals";
import { Goals } from "../../common/delivery/goals/Goals";
import { IsJava } from "../../common/listener/support/pushtest/jvm/jvmPushTests";
import { MaterialChangeToJavaRepo } from "../../common/listener/support/pushtest/jvm/materialChangeToJavaRepo";
import { CachingProjectLoader } from "../../common/repo/CachingProjectLoader";
import { addDemoEditors } from "../parts/demo/demoEditors";
import { addCheckstyleSupport, CheckstyleSupportOptions } from "../parts/stacks/checkstyleSupport";

export type StaticAnalysisMachineOptions = SoftwareDeliveryMachineOptions & CheckstyleSupportOptions;

/**
 * Assemble a machine that performs only static analysis.
 * @return {SoftwareDeliveryMachine}
 */
export function staticAnalysisMachine(opts: Partial<StaticAnalysisMachineOptions> = {}): SoftwareDeliveryMachine {
    const options: StaticAnalysisMachineOptions = {
        artifactStore: new EphemeralLocalArtifactStore(),
        projectLoader: new CachingProjectLoader(),
        useCheckstyle: true,
        reviewOnlyChangedFiles: false,
        ...opts,
    };
    const sdm = new SoftwareDeliveryMachine(
        "Static analysis SDM",
        options,
        whenPushSatisfies(IsJava, MaterialChangeToJavaRepo)
            .itMeans("Change to Java")
            .setGoals(new Goals("Review only", ReviewGoal)));
    addCheckstyleSupport(sdm, options);
    sdm.addReviewerRegistrations({
        name: "YML-hater",
        action: cri => rodHatesYml(cri.project, cri.context),
        options: {considerOnlyChangedFiles: false},
    });

    addDemoEditors(sdm);
    return sdm;
}

const rodHatesYml: ProjectReviewer = async p => {
    return {
        repoId: p.id,
        comments: await saveFromFiles(p, "**/*.yml", f =>
            new DefaultReviewComment("info", "yml-reviewer",
                `Found YML in \`${f.path}\`: Rod regards the format as an insult to computer science`,
                {
                    path: f.path,
                    lineFrom1: 1,
                    offset: -1,
                })),
    };
};
