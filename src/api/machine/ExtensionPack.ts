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

import { GoalSetter } from "../mapping/GoalSetter";
import { MachineConfigurer } from "./MachineConfigurer";

/**
 * Primary unit of extensibility in SDMs.
 * Implemented to expose a capability that can be added to a
 * software delivery machine in a consistent manner.
 * Facilitates modularity at a higher level than FunctionUnit or handlers.
 * For example, a Node module can export an ExtensionPack.
 * ExtensionPacks can optional contribute goal setting, which will be added to existing goal setting.
 */
export interface ExtensionPack extends MachineConfigurer {

    name: string;

    vendor: string;

    version: string;

    /**
     * Human-readable description of this extension pack
     */
    description?: string;

    /**
     * Optional goal setting contributions that will be added into SDM goal setting.
     * Decorates other goal setting behavior.
     */
    goalContributions?: GoalSetter;

}
