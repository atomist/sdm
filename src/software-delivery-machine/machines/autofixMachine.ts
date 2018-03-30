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

import { onAnyPush } from "../../blueprint/dsl/goalDsl";
import { SoftwareDeliveryMachine, SoftwareDeliveryMachineOptions } from "../../blueprint/SoftwareDeliveryMachine";
import { AutofixGoal } from "../../common/delivery/goals/common/commonGoals";
import { Goals } from "../../common/delivery/goals/Goals";
import { CloningProjectLoader } from "../../common/repo/cloningProjectLoader";
import { DefaultArtifactStore } from "../blueprint/artifactStore";
import { AddAtomistJavaHeader, AddAtomistTypeScriptHeader } from "../blueprint/code/autofix/addAtomistHeader";
import { AddLicenseFile } from "../blueprint/code/autofix/addLicenseFile";
import { addDemoEditors } from "../parts/demo/demoEditors";

export type AutofixMachineOptions = SoftwareDeliveryMachineOptions;

/**
 * Assemble a machine that performs only autofixes.
 * @return {SoftwareDeliveryMachine}
 */
export function autofixMachine(opts: Partial<AutofixMachineOptions> = {}): SoftwareDeliveryMachine {
    const options = {
        artifactStore: DefaultArtifactStore,
        projectLoader: CloningProjectLoader,
        ...opts,
    };
    const sdm = new SoftwareDeliveryMachine("Autofix machine", options,
        onAnyPush
            .setGoals(new Goals("Autofix", AutofixGoal)));
    sdm.addAutofixes(
        AddAtomistJavaHeader,
        AddAtomistTypeScriptHeader,
        AddLicenseFile,
    );

    addDemoEditors(sdm);
    return sdm;
}
