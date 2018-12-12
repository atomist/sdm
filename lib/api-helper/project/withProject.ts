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

import { CloneOptions } from "@atomist/automation-client";
import { ExecuteGoalResult } from "../../api/goal/ExecuteGoalResult";
import { ExecuteGoal } from "../../api/goal/GoalInvocation";
import { WithLoadedProject } from "../../spi/project/ProjectLoader";

/**
 * Convenience method to create goal implementations that require a local clone of the project.
 * @param {WithLoadedProject<void | ExecuteGoalResult>} action
 * @param {CloneOptions & {readOnly: boolean}} cloneOptions
 * @returns {ExecuteGoal}
 */
export function doWithProject(action: WithLoadedProject<void | ExecuteGoalResult>,
                              cloneOptions: CloneOptions & { readOnly: boolean } = { readOnly: false }): ExecuteGoal {
    return gi => {
        const { credentials, id } = gi;
        return gi.configuration.sdm.projectLoader.doWithProject({
            credentials,
            id,
            readOnly: cloneOptions.readOnly,
            cloneOptions,
        }, action);
    };
}
