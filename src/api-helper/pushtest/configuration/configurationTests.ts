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

import {
    pushTest,
    PushTest,
    SoftwareDeliveryMachine,
} from "../../..";
import { projectConfigurationValue } from "../../project/configuration/projectConfiguration";

/**
 * Is this SDM enabled on the current project.
 * Checks the .atomist/config.json at key sdm.enabled to see if the current SDM is listed.
 */
export function isSdmEnabled(sdm: SoftwareDeliveryMachine): PushTest {
    return pushTest(
        `Is ${sdm.configuration.name} enabled`,
        async p => {
            const enabled = await projectConfigurationValue("sdm.enabled", p.project, []);
            if (!Array.isArray(enabled)) {
                return enabled === sdm.configuration.name;
            } else {
                return enabled.some(e => e === sdm.configuration.name);
            }
        });
}
