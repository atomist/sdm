/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { HandlerContext } from "@atomist/automation-client";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { Goal, hasPreconditions } from "./Goal";
import { storeGoal } from "./storeGoals";

/**
 * Represents goals set in response to a push
 */
export class Goals {

    public readonly goals: Goal[];

    constructor(public name: string, ...goals: Goal[]) {
        this.goals = goals;
    }

    public setAllToPending(id: GitHubRepoRef,
                           context: HandlerContext,
                           providerId: string): Promise<any> {
        return Promise.all([
            ...this.goals.map(goal =>
                storeGoal(context, {
                    goalSet: this.name,
                    goal,
                    state: hasPreconditions(goal) ? "planned" : "requested",
                    id,
                    providerId,
                })),
        ]);
    }
}

export function isGoals(a: any): a is Goals {
    return !!(a as Goals).goals;
}
