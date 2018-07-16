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

import { Project } from "@atomist/automation-client/project/Project";
import * as _ from "lodash";

export async function projectConfigurationValue<T>(path: string, p: Project, defaultValue?: T): Promise<T> {
    const cf = await p.getFile(".atomist/config.json");
    if (cf)  {
        const conf = JSON.parse(await cf.getContent());
        const value = _.get(conf, path) as T;
        if (value != null) {

            return value;
        } else if (defaultValue !== undefined) {
            return defaultValue;
        }

    } else if (defaultValue) {
        return defaultValue;
    }
    throw new Error(`Required project configuration value '${path}' not available`);
}
