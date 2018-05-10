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
import { GoalCompletionListener, GoalCompletionListenerInvocation, GoalsSetListener, GoalsSetListenerInvocation, StatusState } from "../../..";
import { CredentialsResolver } from "../../../handlers/common/CredentialsResolver";
import { goalKeyString, SdmGoal, SdmGoalState } from "../../../ingesters/sdmGoalIngester";
import { createStatus } from "../../../util/github/ghub";

export function CreatePendingGitHubStatusOnGoalSet(credentialsFactory: CredentialsResolver): GoalsSetListener {
    return async (inv: GoalsSetListenerInvocation) => {
        const {id, credentials} = inv;
        return createStatus(credentials, id as GitHubRepoRef, {
            context: "atomist/sdm/" + inv.goalSetId,
            description: "Atomist SDM Goals in progress",
            target_url: "https://app.atomist.com", // TODO: deep link!
            state: "pending",
        });
    };
}

export function SetGitHubStatusOnGoalCompletion(): GoalCompletionListener {
    return async (inv: GoalCompletionListenerInvocation) => {
        const {id, completedGoal, allGoals, credentials} = inv;
        logger.info("Completed goal: %s with %s in set %s", goalKeyString(completedGoal), completedGoal.state, completedGoal.goalSetId);
        allGoals.forEach(g => logger.info(" goal %s is %s", goalKeyString(g), g.state));

        if (completedGoal.state === "failure") {
            logger.info("Setting GitHub status to failed on %s" + id.sha);
            return createStatus(credentials, id as GitHubRepoRef, {
                context: "atomist/sdm/" + inv.completedGoal.goalSetId,
                description: `Atomist SDM Goals: ${completedGoal.description}`,
                target_url: "https://app.atomist.com", // TODO: deep link!
                state: "failure",
            });
        }
        if (allSuccessful(allGoals)) {
            logger.info("Setting GitHub status to success on %s", id.sha);
            return createStatus(credentials, id as GitHubRepoRef, {
                context: "atomist/sdm/" + completedGoal.goalSetId,
                description: `Atomist SDM Goals: all succeeded`,
                target_url: "https://app.atomist.com", // TODO: deep link!
                state: "success",
            });
        }
    };
}

function allSuccessful(goals: SdmGoal[]): boolean {
    goals.forEach(g => logger.debug("goal %s is %s", g.name, g.state));
    return !goals.find(g => g.state !== "success");
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
