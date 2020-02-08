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

import { HandlerContext } from "@atomist/automation-client/lib/HandlerContext";

export interface SkillContext {
    configuration?: SkillConfiguration;
}

export interface SkillConfiguration {
    name: string,
    parameters: Record<string, any>;
}

export function createSkillContext(ctx: HandlerContext): SkillContext {
    const configuration = (ctx as any)?.trigger?.configuration;
    if (!!configuration) {
        const parameters = {};
        (configuration.parameters || []).forEach(p => parameters[p.name] = p.value);
        return {
            configuration: {
                name: configuration.name,
                parameters,
            }
        }
    }
    return {};
}
