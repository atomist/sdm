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

import { resolvePlaceholders } from "@atomist/automation-client/lib/configuration";
import {
    goal,
    GoalWithFulfillment,
    Parameterized,
} from "../../../api/goal/GoalWithFulfillment";
import { resolvePlaceholder } from "../../machine/yaml/resolvePlaceholder";
import { toArray } from "../../util/misc/array";
import {
    CacheEntry,
    CacheInputGoalDataKey,
    CacheOutputGoalDataKey,
} from "../cache/goalCaching";
import { ContainerSecrets } from "../container/container";

export function skill(name: string,
                      registration: string,
                      options: {
                         uniqueName?: string,
                         parameters?: Parameterized,
                         input?: Array<{ classifier: string }>,
                         output?: CacheEntry[],
                         secrets?: ContainerSecrets,
                     } = {}): GoalWithFulfillment {
    const { uniqueName, parameters, input, output, secrets } = options;
    const g = goal({ displayName: uniqueName, uniqueName: uniqueName || name }).with({
        name: name.replace(/ /g, "_"),
        registration,
    });
    if (!!parameters || !!input || !!output || !!secrets) {
        g.plan = async pli => {
            const { push } = pli;
            await resolvePlaceholders(parameters, v => resolvePlaceholder(v, {
                sha: pli.push.after.sha,
                branch: pli.push.branch,
                repo: {
                    owner: push.repo.owner,
                    name: push.repo.name,
                    providerId: push.repo.org.provider.providerId,
                },
                push: pli.push,
            } as any, pli, {}, true));

            return {
                parameters: {
                    ...(parameters || {}),
                    [CacheInputGoalDataKey]: toArray(input),
                    [CacheOutputGoalDataKey]: toArray(output),
                    "@atomist/sdm/secrets": secrets,
                },
            };
        };
    }
    return g;
}
