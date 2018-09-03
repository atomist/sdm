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

import * as path from "path";
import * as trace from "stack-trace";

/**
 * Strategy for generating goal unique names
 */
export interface GoalNameGenerator {
    /**
     * Generate the name based on given optional prefix
     * @param prefix
     */
    generateName(prefix?: string): string;
}

/**
 * Generates goal names based on source code location.
 * This is stable enough to survive SDM restarts and also supports the cluster and goal forking mode.
 *
 * This implementation has to used directly inside the body of the goal you want to name.
 * Otherwise the source code location might not get captured correctly.
 */
export class SourceLocationGoalNameGenerator implements GoalNameGenerator {

    public generateName(prefix?: string): string {
        let stack;
        try {
            // Just throw an error so that we can capture the stack
            throw new Error();
        } catch (err) {
            stack = trace.parse(err);
        }
        // 0 = this, 1 = the caller of generateName, 2 = the creator of the goal
        const goal = stack[1];
        const goalName = path.basename(goal.getFileName()).split(".")[0];

        const creator = stack[2];
        const creatorFileName = path.basename(creator.getFileName());
        const creatorLineNumber = creator.getLineNumber();
        const name = `${creatorFileName}:${creatorLineNumber}`;

        return `${prefix ? prefix : goalName}#${name}`;
    }
}

// Default GoalNameGenerator
export const DefaultGoalNameGenerator = new SourceLocationGoalNameGenerator();
