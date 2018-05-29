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

import { SoftwareDeliveryMachine } from "./SoftwareDeliveryMachine";

/**
 * Configuration function that can added in SoftwareDeliveryMachine.addCapabilities.
 * Facilitates modularity at a higher level than FunctionUnit or handlers.
 * For example, a Node module can export a configurer.
 */
export interface SoftwareDeliveryMachineConfigurer {

    /**
     * Name of this configurer
     */
    name: string;

    /**
     * Function to configure the given SDM
     * @param sdm
     */
    configure(sdm: SoftwareDeliveryMachine): void;

}
