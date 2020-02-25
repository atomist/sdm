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

import * as _ from "lodash";
import { FulfillableGoal } from "../../../api/goal/GoalWithFulfillment";
import { CacheEntry } from "../cache/goalCaching";
import {
    container,
    ContainerProjectHome,
    ContainerRegistration,
    ContainerSecrets,
} from "./container";

export function action(registration: {
    image: string,
    name: string,
    parameters: Record<string, any>,
    secrets: ContainerSecrets,
    input: Array<{ classifier: string }>,
    output: CacheEntry[],
}): FulfillableGoal {

    const containerRegistration: ContainerRegistration = {
        containers: [{
            name: registration.name,
            image: registration.image,
            secrets: registration.secrets,
            env: convertParameters(registration.parameters),
        }],
        input: registration.input,
        output: registration.output,
        callback: async (r, p, g, e, c) => {
            const env: Array<{ name: string, value: string }> = [{
                name: "GITHUB_WORKFLOW",
                value: registration.name,
            }, {
                name: "GITHUB_ACTION",
                value: e.goalSetId,
            }, {
                name: "GITHUB_ACTIONS",
                value: "true",
            }, {
                name: "GITHUB_ACTOR",
                value: "Atomist",
            }, {
                name: "GITHUB_REPOSITORY",
                value: `${e.repo.owner}/${e.repo.name}`,
            }, {
                name: "GITHUB_EVENT_NAME",
                value: "push",
            }, {
                name: "GITHUB_WORKSPACE",
                value: ContainerProjectHome,
            }, {
                name: "GITHUB_SHA",
                value: e.sha,
            }];
            r.containers[0].env = [
                ...(r.containers[0].env || []),
                ...env,
            ];
            if (!!r.containers[0]?.secrets?.env) {
                r.containers[0].secrets.env = r.containers[0].secrets.env.map(ev => ({
                    name: `INPUT_${ev.name.toUpperCase()}`,
                    value: ev.value,
                }));
            }
            return r;
        },
    };

    return container(registration.name, containerRegistration);

}

function convertParameters(parameters: Record<string, any>): Array<{ name: string, value: string }> {
    return _.map(parameters || {}, (v, k) => ({ name: `INPUT_${k.toUpperCase()}`, value: v }));
}
