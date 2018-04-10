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

import { SoftwareDeliveryMachine } from "../../../blueprint/SoftwareDeliveryMachine";
import { MavenFingerprinter } from "../../../common/delivery/code/fingerprint/maven/MavenFingerprinter";
import { AddAtomistJavaHeader } from "../../blueprint/code/autofix/addAtomistHeader";
import { addCheckstyleSupport, CheckstyleSupportOptions } from "./checkstyleSupport";

export type JavaSupportOptions = CheckstyleSupportOptions;

/**
 * Configuration common to Java SDMs, wherever they deploy
 * @param {SoftwareDeliveryMachine} softwareDeliveryMachine
 * @param {{useCheckstyle: boolean}} opts
 */
export function addJavaSupport(softwareDeliveryMachine: SoftwareDeliveryMachine, opts: JavaSupportOptions) {
    addCheckstyleSupport(softwareDeliveryMachine, opts);
    softwareDeliveryMachine
        .addFingerprinterRegistrations(new MavenFingerprinter())
        .addAutofixes(AddAtomistJavaHeader);
}
