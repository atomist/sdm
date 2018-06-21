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
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { goalKeyString } from "../../../../../api-helper/goal/sdmGoal";
import { SdmGoal, SdmGoalState } from "../../../../../api/goal/SdmGoal";
import {
    GoalCompletionListener,
    GoalCompletionListenerInvocation,
    GoalsSetListener,
    GoalsSetListenerInvocation,
} from "../../../../../api/listener/GoalsSetListener";
import { CredentialsResolver } from "../../../../../spi/credentials/CredentialsResolver";
import { StatusState } from "../../../../../typings/types";
import { createStatus } from "../../../../../util/github/ghub";

export function createPendingGitHubStatusOnGoalSet(credentialsFactory: CredentialsResolver): GoalsSetListener {
    return async (inv: GoalsSetListenerInvocation) => {
        const {id, credentials} = inv;
        if (inv.goalSet && inv.goalSet.goals && inv.goalSet.goals.length > 0) {
            logger.info("Created goal set '%s'. Creating in progress GitHub status", inv.goalSetId);
            return createStatus(credentials, id as GitHubRepoRef, {
                context: "sdm/atomist",
                description: "Atomist SDM Goals in progress",
                target_url: "https://app.atomist.com", // TODO: deep link!
                state: "pending",
            });
        } else {
            logger.info("No goals planned. Not creating in progress GitHub status");
            return Promise.resolve();
        }
    };
}

export function SetGitHubStatusOnGoalCompletion(): GoalCompletionListener {
    return async (inv: GoalCompletionListenerInvocation) => {
        const {id, completedGoal, allGoals, credentials} = inv;
        logger.info("Completed goal: '%s' with '%s' in set '%s'",
            goalKeyString(completedGoal), completedGoal.state, completedGoal.goalSetId);

        if (completedGoal.state === "failure") {
            logger.info("Setting GitHub status to failed on %s" + id.sha);
            return createStatus(credentials, id as GitHubRepoRef, {
                context: "sdm/atomist",
                description: `Atomist SDM Goals: ${completedGoal.description}`,
                target_url: "https://app.atomist.com", // TODO: deep link!
                state: "failure",
            });
        }
        if (allSuccessful(allGoals)) {
            logger.info("Setting GitHub status to success on %s", id.sha);
            return createStatus(credentials, id as GitHubRepoRef, {
                context: "sdm/atomist",
                description: `Atomist SDM Goals: all succeeded`,
                target_url: "https://app.atomist.com", // TODO: deep link!
                state: "success",
            });
        }
    };
}

function allSuccessful(goals: SdmGoal[]): boolean {
    goals.forEach(g => logger.debug("goal %s is %s", g.name, g.state));
    return !goals.some(g => g.state !== "success");
}

export function sdmGoalStateToGitHubStatusState(goalState: SdmGoalState): StatusState {
    switch (goalState) {
        case "planned":
        case "requested":
        case "in_process":
            return "pending" as StatusState;
        case "waiting_for_approval":
        case "success":
            return "success" as StatusState;
        case "failure":
        case "skipped":
            return "failure" as StatusState;
        default:
            throw new Error("Unknown goal state " + goalState);
    }
}
