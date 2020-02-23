/*
 * Copyright © 2019 Atomist, Inc.
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

import { AutomationClient } from "@atomist/automation-client/lib/automationClient";
import { AutomationEventListenerSupport } from "@atomist/automation-client/lib/server/AutomationEventListener";
import { logger } from "@atomist/automation-client/lib/util/logger";
import * as cluster from "cluster";
import * as fg from "fast-glob";
import * as fs from "fs-extra";
import * as path from "path";
import { SoftwareDeliveryMachine } from "../../../../../../api/machine/SoftwareDeliveryMachine";
import { CacheConfiguration } from "../../../../../../api/machine/SoftwareDeliveryMachineOptions";

/**
 * Event listener that cleans up cached artifacts that are older then 2 hours.
 */
export class CacheCleanupAutomationEventListener extends AutomationEventListenerSupport {

    constructor(private readonly sdm: SoftwareDeliveryMachine) {
        super();
    }

    public async startupSuccessful(client: AutomationClient): Promise<void> {
        const possibleCacheConfiguration = this.sdm.configuration.sdm.cache as (CacheConfiguration["cache"] | undefined);
        if (cluster.isMaster && possibleCacheConfiguration && possibleCacheConfiguration.enabled) {
            const cachePath = possibleCacheConfiguration.path || "/opt/data";

            setTimeout(async () => {
                try {
                    const ts = Date.now() - (1000 * 60 * 60 * 2); // 2 hour threshold
                    if (fs.existsSync(cachePath)) {
                        const matches = await fg("**/*", { cwd: cachePath });
                        for (const m of matches) {
                            const p = path.join(cachePath, m);
                            try {
                                const st = await fs.stat(p);
                                if (st.mtimeMs < ts && st.isFile()) {
                                    logger.debug(`Deleting cached file '${p}'`);
                                    await fs.remove(p);
                                }
                            } catch (e) {
                                logger.debug("Failed to delete cached file '%s': %s", p, e.message);
                            }
                        }
                    }
                } catch (err) {
                    logger.debug("Failed to clean cache directory '%s': %s", cachePath, err.message);
                }
            });
        }
    }
}
