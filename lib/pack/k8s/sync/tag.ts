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

import {
    Configuration,
    configurationValue,
} from "@atomist/automation-client/lib/configuration";

/**
 * Unique tag to include in sync commits made by this SDM.
 *
 * @param config the SDM configuration
 * @return unique commit tag string
 */
export function commitTag(config?: Configuration): string {
    const name = (config && config.name) ? config.name : configurationValue<string>("name", "@atomist/sdm-pack-k8s");
    return `[atomist:sync-commit=${name}]`;
}
