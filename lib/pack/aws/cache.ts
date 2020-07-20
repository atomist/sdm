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

import { doWithRetry } from "@atomist/automation-client/lib/util/retry";
import * as AWS from "aws-sdk";
import * as fs from "fs-extra";
import { GoalInvocation } from "../../api/goal/GoalInvocation";
import { CacheConfiguration } from "../../api/machine/SoftwareDeliveryMachineOptions";
import { GoalCacheArchiveStore } from "../../core/goal/cache/CompressingGoalCache";

export interface S3CacheConfiguration extends CacheConfiguration {
    cache?: {
        /**
         * AWS S3 bucket to perist cache entries to.  If
         * not provided, it defaults to
         * "sdm-WORKSPACE_ID-SDM_NAME-goal-cache", with "WORKSPACE_ID"
         * replaced with your Atomist workspace ID and "SDM_NAME"
         * replaced with the name of the running SDM, converting
         * letters to lower case and removing all characters that are
         * not letters, numbers, and dashes (-).  It makes no attempt
         * to create this bucket, so make sure it exists before trying
         * to use it.
         */
        bucket?: string;
        /** Set to true to enable goal input/output caching */
        enabled?: boolean;
        /** Path prefix, defaults to "goal-cache". */
        path?: string;
        /** AWS region for cache bucket. */
        region?: string;
    };
}

type AwsOp = (s: AWS.S3, b: string, p: string) => Promise<any>;
export type CacheConfig = Required<Pick<Required<S3CacheConfiguration>["cache"], "bucket" | "path">> & { region?: string };

/**
 * Goal archive store that stores the compressed archives in a AWS
 * S3 bucket.  All failures are caught and logged.  If
 * retrieval fails, the error is rethrown so the cache-miss listeners
 * will be invoked.
 */
export class S3GoalCacheArchiveStore implements GoalCacheArchiveStore {
    public async store(gi: GoalInvocation, classifier: string, archivePath: string): Promise<string> {
        const file = fs.createReadStream(archivePath);
        return this.awsS3(
            gi,
            classifier,
            async (storage, bucket, cachePath) =>
                storage.putObject({ Bucket: bucket, Key: cachePath, Body: file }).promise(),
            "store",
        );
    }

    public async delete(gi: GoalInvocation, classifier: string): Promise<void> {
        await this.awsS3(
            gi,
            classifier,
            async (storage, bucket, cachePath) => storage.deleteObject({ Bucket: bucket, Key: cachePath }).promise(),
            "delete",
        );
    }

    public async retrieve(gi: GoalInvocation, classifier: string, targetArchivePath: string): Promise<void> {
        await this.awsS3(
            gi,
            classifier,
            async (storage, bucket, cachePath) => {
                return new Promise((resolve, reject) => {
                    storage
                        .getObject({ Bucket: bucket, Key: cachePath })
                        .createReadStream()
                        .on("error", reject)
                        .pipe(fs.createWriteStream(targetArchivePath))
                        .on("error", reject)
                        .on("close", () => resolve(targetArchivePath));
                });
            },
            "retrieve",
        );
    }

    private async awsS3(gi: GoalInvocation, classifier: string, op: AwsOp, verb: string): Promise<string> {
        const cacheConfig = getCacheConfig(gi);
        const cachePath = getCachePath(cacheConfig, classifier);
        const storage = new AWS.S3({ region: cacheConfig.region });
        const objectUri = `s3://${cacheConfig.bucket}/${cachePath}`;
        const gerund = verb.replace(/e$/, "ing");
        try {
            gi.progressLog.write(`${gerund} cache archive ${objectUri}`);
            await doWithRetry(() => op(storage, cacheConfig.bucket, cachePath), `${verb} cache archive`);
            gi.progressLog.write(`${verb}d cache archive ${objectUri}`);
            return objectUri;
        } catch (e) {
            e.message = `Failed to ${verb} cache archive ${objectUri}: ${e.message}`;
            gi.progressLog.write(e.message);
            if (verb === "retrieve") {
                throw e;
            }
        }
        return undefined;
    }
}

/** Construct object path for cache configuration and classifier. */
export function getCachePath(cacheConfig: CacheConfig, classifier: string = "default"): string {
    return [cacheConfig.path, classifier, "cache.tar.gz"].join("/");
}

/**
 * Retrieve cache configuration and populate with default values.
 */
export function getCacheConfig(gi: GoalInvocation): CacheConfig {
    const cacheConfig = gi.configuration.sdm.cache || {};
    cacheConfig.bucket =
        cacheConfig.bucket ||
        `sdm-${gi.context.workspaceId}-${gi.configuration.name}-goal-cache`
            .toLowerCase()
            .replace(/[^-a-z0-9]*/g, "")
            .replace(/--+/g, "-");
    cacheConfig.path = cacheConfig.path || "goal-cache";
    return cacheConfig;
}
