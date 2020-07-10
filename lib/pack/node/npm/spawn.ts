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
import { SpawnLogOptions } from "../../../api-helper/misc/child_process";
import { ProgressLog } from "../../../spi/log/ProgressLog";

/**
 * Options to use when running node commands like npm run compile that
 * require dev dependencies to be installed
 */
export const DevelopmentEnvOptions: Partial<SpawnLogOptions> = {
    env: {
        ...process.env,
        NODE_ENV: "development",
    },
};

/**
 * Generate appropriate options for [[spawnLog]] for project and progress log.
 */
export function npmSpawnLogOptions(p: GitProject, log: ProgressLog): SpawnLogOptions {
    return {
        cwd: p.baseDir,
        ...DevelopmentEnvOptions,
        log,
    };
}
