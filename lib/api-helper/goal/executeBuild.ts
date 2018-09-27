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
import { ExecuteGoalResult } from "../../api/goal/ExecuteGoalResult";
import {
    ExecuteGoal,
    GoalInvocation,
} from "../../api/goal/GoalInvocation";
import { Builder } from "../../spi/build/Builder";

/**
 * Execute build with the appropriate builder
 * @param projectLoader used to load projects
 * @param builder builder to user
 */
export function executeBuild(builder: Builder): ExecuteGoal {
    return async (goalInvocation: GoalInvocation): Promise<void | ExecuteGoalResult> => {
        const { sdmGoal, credentials, id, context, progressLog, addressChannels, configuration } = goalInvocation;

        logger.info("Building project '%s/%s' with builder '%s'", id.owner, id.repo, builder.name);

        // the builder is expected to result in a complete Build event (which will update the build status)
        // and an ImageLinked event (which will update the artifact status).
        return builder.initiateBuild(
            credentials,
            id,
            addressChannels,
            {
                name: sdmGoal.repo.name,
                owner: sdmGoal.repo.owner,
                providerId: sdmGoal.repo.providerId,
                branch: sdmGoal.branch,
                defaultBranch: sdmGoal.push.repo.defaultBranch,
                sha: sdmGoal.sha,
            },
            progressLog,
            context,
            configuration);
    };
}
