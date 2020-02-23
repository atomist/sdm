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

import { Deferred } from "@atomist/automation-client/lib/internal/util/Deferred";
import { guid } from "@atomist/automation-client/lib/internal/util/string";
import { GitProject } from "@atomist/automation-client/lib/project/git/GitProject";
import * as fg from "fast-glob";
import * as fs from "fs-extra";
import * as JSZip from "jszip";
import * as os from "os";
import * as path from "path";
import { spawnLog } from "../../../api-helper/misc/child_process";
import { GoalInvocation } from "../../../api/goal/GoalInvocation";
import { FileSystemGoalCacheArchiveStore } from "./FileSystemGoalCacheArchiveStore";
import { GoalCache } from "./goalCaching";

export interface GoalCacheArchiveStore {
    /**
     * Store a compressed goal archive
     * @param gi The goal invocation thar triggered the caching
     * @param classifier The classifier of the cache
     * @param archivePath The path of the archive to be stored.
     */
    store(gi: GoalInvocation, classifier: string, archivePath: string): Promise<string>;

    /**
     * Remove a compressed goal archive
     * @param gi The goal invocation thar triggered the cache removal
     * @param classifier The classifier of the cache
     */
    delete(gi: GoalInvocation, classifier: string): Promise<void>;

    /**
     * Retrieve a compressed goal archive
     * @param gi The goal invocation thar triggered the cache retrieval
     * @param classifier The classifier of the cache
     * @param targetArchivePath The destination path where the archive needs to be stored.
     */
    retrieve(gi: GoalInvocation, classifier: string, targetArchivePath: string): Promise<void>;
}

export enum CompressionMethod {
    TAR,
    ZIP,
}

/**
 * Cache implementation that caches files produced by goals to an archive that can then be stored,
 * using tar and gzip to create the archives per goal invocation (and classifier if present).
 */
export class CompressingGoalCache implements GoalCache {

    public constructor(private readonly store: GoalCacheArchiveStore = new FileSystemGoalCacheArchiveStore(),
                       private readonly method: CompressionMethod = CompressionMethod.TAR) {
    }

    public async put(gi: GoalInvocation,
                     project: GitProject,
                     files: string[],
                     classifier?: string): Promise<string> {
        const archiveName = "atomist-cache";
        const teamArchiveFileName = path.join(os.tmpdir(), `${archiveName}.${guid().slice(0, 7)}`);
        const slug = `${gi.id.owner}/${gi.id.repo}`;
        const spawnLogOpts = {
            log: gi.progressLog,
            cwd: project.baseDir,
        };

        let teamArchiveFileNameWithSuffix = teamArchiveFileName;
        if (this.method === CompressionMethod.TAR) {
            const tarResult = await spawnLog("tar", ["-cf", teamArchiveFileName, ...files], spawnLogOpts);
            if (tarResult.code) {
                gi.progressLog.write(`Failed to create tar archive '${teamArchiveFileName}' for ${slug}`);
                return undefined;
            }
            const gzipResult = await spawnLog("gzip", ["-3", teamArchiveFileName], spawnLogOpts);
            if (gzipResult.code) {
                gi.progressLog.write(`Failed to gzip tar archive '${teamArchiveFileName}' for ${slug}`);
                return undefined;
            }
            teamArchiveFileNameWithSuffix += ".gz";
        } else if (this.method === CompressionMethod.ZIP) {
            teamArchiveFileNameWithSuffix += ".zip";
            try {
                const zipResult = await spawnLog("zip", ["-qr", teamArchiveFileNameWithSuffix, ...files], spawnLogOpts);
                if (zipResult.error) {
                    throw zipResult.error;
                } else if (zipResult.code || zipResult.signal) {
                    const msg = `Failed to run zip binary to create ${teamArchiveFileNameWithSuffix}: ${zipResult.code} (${zipResult.signal})`;
                    gi.progressLog.write(msg);
                    throw new Error(msg);
                }
            } catch (e) {
                const zip = new JSZip();
                for (const file of files) {
                    const p = path.join(project.baseDir, file);
                    if ((await fs.stat(p)).isFile()) {
                        zip.file(file, fs.createReadStream(p));
                    } else {
                        const dirFiles = await fg(`${file}/**/*`, { cwd: project.baseDir, dot: true });
                        for (const dirFile of dirFiles) {
                            zip.file(dirFile, fs.createReadStream(path.join(project.baseDir, dirFile)));
                        }
                    }
                }
                const defer = new Deferred<string>();
                zip.generateNodeStream({
                    type: "nodebuffer",
                    streamFiles: true,
                    compression: "DEFLATE",
                    compressionOptions: { level: 6 },
                })
                    .pipe(fs.createWriteStream(teamArchiveFileNameWithSuffix))
                    .on("finish", () => {
                        defer.resolve(teamArchiveFileNameWithSuffix);
                    });
                await defer.promise;
            }
        }
        return this.store.store(gi, classifier, teamArchiveFileNameWithSuffix);
    }

    public async remove(gi: GoalInvocation, classifier?: string): Promise<void> {
        await this.store.delete(gi, classifier);
    }

    public async retrieve(gi: GoalInvocation, project: GitProject, classifier?: string): Promise<void> {
        const archiveName = "atomist-cache";
        const teamArchiveFileName = path.join(os.tmpdir(), `${archiveName}.${guid().slice(0, 7)}`);
        await this.store.retrieve(gi, classifier, teamArchiveFileName);
        if (fs.existsSync(teamArchiveFileName)) {
            if (this.method === CompressionMethod.TAR) {
                await spawnLog("tar", ["-xzf", teamArchiveFileName], {
                    log: gi.progressLog,
                    cwd: project.baseDir,
                });
            } else if (this.method === CompressionMethod.ZIP) {
                const zip = await JSZip.loadAsync(await fs.readFile(teamArchiveFileName));
                for (const file in zip.files) {
                    if (zip.files.hasOwnProperty(file)) {
                        const entry = zip.file(file);
                        if (!!entry) {
                            const p = path.join(project.baseDir, file);
                            await fs.ensureDir(path.dirname(p));
                            await fs.writeFile(path.join(project.baseDir, file), await zip.file(file).async("nodebuffer"));
                        }
                    }
                }
            }
        } else {
            throw Error("No cache entry");
        }
    }

}
