/*
 * Copyright © 2020 Atomist, Inc.
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

import { AutomationEventListenerSupport } from "@atomist/automation-client/lib/server/AutomationEventListener";
import { AbstractSoftwareDeliveryMachine } from "../../api-helper/machine/AbstractSoftwareDeliveryMachine";
import { SoftwareDeliveryMachine } from "../../api/machine/SoftwareDeliveryMachine";

/**
 * AutomationEventListener that notifies the SDM StartupListeners that this SDM has been
 * successfully started up
 */
export class InvokeSdmStartupListenersAutomationEventListener extends AutomationEventListenerSupport {

    constructor(private readonly sdm: SoftwareDeliveryMachine) {
        super();
    }

    public startupSuccessful(): Promise<void> {
        if ((this.sdm as AbstractSoftwareDeliveryMachine).notifyStartupListeners) {
            return (this.sdm as AbstractSoftwareDeliveryMachine).notifyStartupListeners();
        }
        return Promise.resolve();
    }
}
