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

import { logger } from "@atomist/automation-client";
import { BaseContext, GitHubStatusContext } from "../../../../../api/goal/GitHubContext";

/**
 * if this is a context we created, then we can interpret it.
 * Otherwise returns undefined
 * @param {string} context
 * @returns {{base: string; env: string; stage: string}}
 */
export function splitContext(context: GitHubStatusContext) {
    if (context.startsWith(BaseContext)) {
        const numberAndName = /([0-9\.]+)-(.*)/;
        const wholeContext = /^sdm\/atomist\/(.*)\/(.*)$/;

        const matchWhole = context.match(wholeContext);
        if (!matchWhole) {
            return undefined;
        }

        const goalPart = matchWhole[2];
        const matchEnv = matchWhole[1].match(numberAndName);
        const matchGoal = goalPart.match(numberAndName);
        if (!matchGoal || !matchEnv) {
            logger.debug(`Did not find number and name in ${matchWhole[1]} or ${matchWhole[2]}`);
            return undefined;
        }
        const name = matchGoal[2];
        const goalOrder = +matchGoal[1];

        return {
            base: BaseContext,
            env: matchEnv[2],
            envOrder: +matchEnv[1], name,
            goalOrder,
            envPart: matchWhole[1],
            goalPart,
            goalName: name,
        };
    }
}

/*
 * true if contextB is in the same series of goals as A,
 * and A comes before B
 */
export function contextIsAfter(contextA: GitHubStatusContext, contextB: GitHubStatusContext): boolean {
    if (belongToSameSeriesOfGoals(contextA, contextB)) {
        const splitA = splitContext(contextA);
        const splitB = splitContext(contextB);
        return splitA.envOrder < splitB.envOrder || splitA.goalOrder < splitB.goalOrder;
    }
}

function belongToSameSeriesOfGoals(contextA: GitHubStatusContext, contextB: GitHubStatusContext): boolean {
    const splitA = splitContext(contextA);
    const splitB = splitContext(contextB);
    return splitA && splitB && splitA.base === splitB.base;
}
