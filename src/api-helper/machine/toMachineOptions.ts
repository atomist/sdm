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

import { MachineConfiguration } from "../../api/machine/MachineConfiguration";
import { SoftwareDeliveryMachineOptions } from "../../api/machine/SoftwareDeliveryMachineOptions";

export type MachineOrMachineOptions = MachineConfiguration<any> | SoftwareDeliveryMachineOptions;

export function toMachineOptions(m: MachineOrMachineOptions): SoftwareDeliveryMachineOptions {
    return isMachineConfiguration(m) ?
        m.configuration.sdm :
        m;
}

function isMachineConfiguration(o: object): o is MachineConfiguration<any> {
    const maybe = o as MachineConfiguration<any>;
    return !!maybe.configuration;
}
