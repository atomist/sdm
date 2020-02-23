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

import * as fs from "fs-extra";
import * as os from "os";
import * as path from "path";
import { spawnLog } from "../../../api-helper/misc/child_process";
import { GoalInvocation } from "../../../api/goal/GoalInvocation";
import { CacheConfiguration } from "../../../api/machine/SoftwareDeliveryMachineOptions";
import { GoalCacheArchiveStore } from "./CompressingGoalCache";

/**
 * Goal archive store that stores the compressed archives into the SDM cache directory.
 */
export class FileSystemGoalCacheArchiveStore implements GoalCacheArchiveStore {
    private static readonly archiveName: string = "cache.tar.gz";

    public async store(gi: GoalInvocation, classifier: string, archivePath: string): Promise<string> {
        const cacheDir = await FileSystemGoalCacheArchiveStore.getCacheDirectory(gi, classifier);
        const archiveName = FileSystemGoalCacheArchiveStore.archiveName;
        const archiveFileName = path.join(cacheDir, archiveName);
        await spawnLog("mv", [archivePath, archiveFileName], {
            log: gi.progressLog,
        });
        return archiveFileName;
    }

    public async delete(gi: GoalInvocation, classifier: string): Promise<void> {
        const cacheDir = await FileSystemGoalCacheArchiveStore.getCacheDirectory(gi, classifier);
        const archiveName = FileSystemGoalCacheArchiveStore.archiveName;
        const archiveFileName = path.join(cacheDir, archiveName);
        await spawnLog("rm", ["-f", archiveFileName], {
            log: gi.progressLog,
        });
    }

    public async retrieve(gi: GoalInvocation, classifier: string, targetArchivePath: string): Promise<void> {
        const cacheDir = await FileSystemGoalCacheArchiveStore.getCacheDirectory(gi, classifier);
        const archiveName = FileSystemGoalCacheArchiveStore.archiveName;
        const archiveFileName = path.join(cacheDir, archiveName);
        await spawnLog("cp", [archiveFileName, targetArchivePath], {
            log: gi.progressLog,
        });
    }

    private static async getCacheDirectory(gi: GoalInvocation, classifier: string = "default"): Promise<string> {
        const defaultCachePath = path.join(os.homedir(), ".atomist", "cache");
        const possibleCacheConfiguration = gi.configuration.sdm.cache as (CacheConfiguration["cache"] | undefined);
        const sdmCacheDir = possibleCacheConfiguration ? (possibleCacheConfiguration.path || defaultCachePath) : defaultCachePath;
        const cacheDir = path.join(sdmCacheDir, classifier);
        await fs.mkdirs(cacheDir);
        return cacheDir;
    }
}
