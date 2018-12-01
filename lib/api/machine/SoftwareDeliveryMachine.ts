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

import { EventRegistrationManager } from "../registration/EventRegistrationManager";
import { IngesterRegistrationManager } from "../registration/IngesterRegistrationManager";
import { CommandRegistrationManager } from "./CommandRegistrationManager";
import { ExtensionPack } from "./ExtensionPack";
import { FunctionalUnit } from "./FunctionalUnit";
import { GoalDrivenMachine } from "./GoalDrivenMachine";
import { ListenerRegistrationManager } from "./ListenerRegistrationManager";
import { SoftwareDeliveryMachineConfiguration } from "./SoftwareDeliveryMachineOptions";

/**
 * Class instantiated to create a **Software Delivery MachineConfiguration**.
 * Combines commands and delivery event handling using _goals_.
 *
 * Goals and goal "implementations" can be defined by users.
 *
 * The most important element of a software delivery machine is setting
 * zero or more _push rules_.
 * This is normally done using an internal DSL
 */
export interface SoftwareDeliveryMachine<O extends SoftwareDeliveryMachineConfiguration = SoftwareDeliveryMachineConfiguration>
    extends GoalDrivenMachine<O>,
        ListenerRegistrationManager,
        CommandRegistrationManager,
        EventRegistrationManager,
        IngesterRegistrationManager,
        FunctionalUnit {

    /**
     * Add capabilities from these extension packs.
     * This is the primary SDM extension
     * mechanism. Extension packs are typically brought in as Node modules,
     * and can contribute goals as well configure SDM behavior.
     * @param {ExtensionPack} packs
     * @return {this}
     */
    addExtensionPacks(...packs: ExtensionPack[]): this;

    readonly extensionPacks: ReadonlyArray<ExtensionPack>;

}
