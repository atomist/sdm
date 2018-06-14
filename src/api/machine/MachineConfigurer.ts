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
 * Configure the given SDM
 */
export type ConfigureMachine = (sdm: SoftwareDeliveryMachine) => void;

/**
 * Extended by types that know how to configure an existing SDM.
 * The SDM's configuration will be valid and can be accessed in
 * the implementation of the configure method.
 */
export interface MachineConfigurer {

    /**
     * Function to configure the given SDM
     * @param sdm
     */
    configure: ConfigureMachine;

}
