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

import { GitProject } from "@atomist/automation-client/lib/project/git/GitProject";
import { Project } from "@atomist/automation-client/lib/project/Project";
import { logger } from "@atomist/automation-client/lib/util/logger";
import { GoalInvocation } from "../../../api/goal/GoalInvocation";
import { GoalCache } from "./goalCaching";

/**
 * Cache implementation that doesn't cache anything and will always trigger the fallback.
 */
export class NoOpGoalCache implements GoalCache {
    public async put(gi: GoalInvocation, project: GitProject, files: string[], classifier?: string): Promise<string> {
        logger.warn(`No-Op goal cache in use; no cache will be preserved!`);
        return undefined;
    }

    public async remove(gi: GoalInvocation, classifier?: string): Promise<void> {
        logger.warn(`No-Op goal cache in use; no cache will be removed!`);
    }

    public async retrieve(gi: GoalInvocation, project: Project, classifier?: string): Promise<void> {
        throw Error("No cache entry");
    }
}
