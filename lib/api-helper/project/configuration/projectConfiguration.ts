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

import {
    configurationValue,
    Project,
} from "@atomist/automation-client";
import * as _ from "lodash";

/**
 * Gather a configuration value from:
 *
 * 1) within a file .atomist/config.json within the Project
 * 2) from within the `sdm` property in the wider, globally available configuration. For where these come from, see:
 *  https://atomist.github.io/automation-client/modules/_lib_configuration_.html?_ga=2.177847404.819470215.1551037765-1203552146.1527824248#loadconfiguration
 * 3) the default passed in, if any
 * 4) ... or else throw.
 */
export async function projectConfigurationValue<T>(path: string, p: Project, defaultValue?: T): Promise<T> {
    // Project specific configuration first
    const cf = await p.getFile(".atomist/config.json");
    if (cf) {
        const conf = JSON.parse(await cf.getContent());
        const value = _.get(conf, path) as T;
        if (value !== undefined) {
            return value;
        }
    }
    // SDM configuration as fallback
    const cfg = configurationValue<T>(`sdm.${path}`, defaultValue);
    if (cfg) {
        return cfg;
    }
    // Lastly use the defaultValue if provided
    if (defaultValue !== undefined) {
        return defaultValue;
    }

    throw new Error(`Required project configuration value '${path}' not available`);
}
