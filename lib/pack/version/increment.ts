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

import { RemoteRepoRef } from "@atomist/automation-client/lib/operations/common/RepoId";
import { GitProject } from "@atomist/automation-client/lib/project/git/GitProject";
import { logger } from "@atomist/automation-client/lib/util/logger";
import { spawnLog } from "../../api-helper/misc/child_process";
import { ExecuteGoalResult } from "../../api/goal/ExecuteGoalResult";
import { Goal } from "../../api/goal/Goal";
import { ExecuteGoal, GoalInvocation } from "../../api/goal/GoalInvocation";
import { DefaultGoalNameGenerator } from "../../api/goal/GoalNameGenerator";
import {
    FulfillableGoal,
    FulfillableGoalDetails,
    getGoalDefinitionFrom,
    ImplementationRegistration,
} from "../../api/goal/GoalWithFulfillment";
import { SdmGoalEvent } from "../../api/goal/SdmGoalEvent";
import { goalInvocationVersion } from "../../core/delivery/build/local/projectVersioner";
import { ProgressLog } from "../../spi/log/ProgressLog";
import { releaseLikeVersion } from "./semver";

/**
 * Arguments passed to a [[VersionIncrementer]].
 */
export interface VersionIncrementerArguments {
    /**
     * The release semantic version for the goal set triggering this
     * increment request.  If the version in the project is not equal
     * to the provided current version, it is up to function whether
     * to increment the version or not.  If the function makes
     * changes, they will be committed and pushed.  If it does not
     * make changes, nothing will be committed.
     */
    currentVersion: string;
    /** SDM event triggering this goal. */
    goalEvent: SdmGoalEvent;
    /** Remote repository reference. */
    id: RemoteRepoRef;
    /** The part of the semantic version to increment. */
    increment: "major" | "minor" | "patch";
    /** Progress log to write status updates to. */
    log: ProgressLog;
    /** Project to increment version in. */
    project: GitProject;
}

/**
 * A function capable of incrementing the specified semantic version
 * element in the project that is used by the fulfillment goal
 * executor.
 */
export type VersionIncrementer = (args: VersionIncrementerArguments) => Promise<ExecuteGoalResult>;

/**
 * [[IncrementVersion]] fulfillment options.
 */
export interface IncrementVersionRegistration extends Partial<ImplementationRegistration> {
    /** Function capable of incrementing version. */
    versionIncrementer: VersionIncrementer;
}

/**
 * Class that abstracts incrementing project version after a release.
 */
export class IncrementVersion extends FulfillableGoal {
    constructor(
        goalDetailsOrUniqueName: FulfillableGoalDetails | string = DefaultGoalNameGenerator.generateName(
            "increment-version",
        ),
        ...dependsOn: Goal[]
    ) {
        super(
            {
                workingDescription: "Incrementing version",
                completedDescription: "Incremented version",
                failedDescription: "Incrementing version failure",
                ...getGoalDefinitionFrom(
                    goalDetailsOrUniqueName,
                    DefaultGoalNameGenerator.generateName("increment-version"),
                ),
                displayName: "increment version",
            },
            ...dependsOn,
        );
    }

    /**
     * Add fulfillment to this goal.
     */
    public with(registration: IncrementVersionRegistration): this {
        super.addFulfillment({
            name: registration.name || DefaultGoalNameGenerator.generateName("increment-version"),
            goalExecutor: executeIncrementVersion(registration.versionIncrementer),
            pushTest: registration.pushTest,
        });
        return this;
    }
}

/**
 * Return goal executor that increments version using the provided
 * increment function and then commits & pushes the changes.
 *
 * Since this function changes and commits to the project at a time
 * when several other goals may be doing the same, it first checks out
 * the branch associated with the goal invocation and pulls to get the
 * latest head from the remote.
 */
export function executeIncrementVersion(versionIncrementer: VersionIncrementer): ExecuteGoal {
    return async (gi: GoalInvocation): Promise<ExecuteGoalResult> => {
        const { configuration, credentials, id, context, progressLog } = gi;
        if (!configuration.sdm.projectLoader) {
            const message = `Invalid configuration: no projectLoader`;
            logger.error(message);
            progressLog.write(message);
            return { code: 1, message };
        }

        return configuration.sdm.projectLoader.doWithProject({ credentials, id, context, readOnly: false }, async p => {
            const version = await goalInvocationVersion(gi);
            if (!version) {
                const message = `Current goal set does not have a version`;
                logger.error(message);
                progressLog.write(message);
                return { code: 1, message };
            }
            const versionRelease = releaseLikeVersion(version, gi);
            const slug = `${p.id.owner}/${p.id.repo}`;
            const branch = gi.goalEvent.branch;
            const remote = p.remote || "origin";
            const spawnOpts = { cwd: p.baseDir, log: progressLog };
            try {
                progressLog.write(`Pulling branch '${branch}' of ${slug}`);
                await p.checkout(branch);
                const pullResult = await spawnLog("git", ["pull", remote, branch], spawnOpts);
                if (pullResult.code) {
                    throw new Error(pullResult.message || "git pull failed");
                }
                p.branch = branch;
            } catch (e) {
                const message = `Failed to get latest changes on branch '${branch}' for ${slug}: ${e.message}`;
                logger.error(message);
                progressLog.write(message);
                return { code: 1, message };
            }

            try {
                progressLog.write(`Incrementing version on branch '${branch}' for ${slug}`);
                const incrementResult = await versionIncrementer({
                    currentVersion: versionRelease,
                    goalEvent: gi.goalEvent,
                    id,
                    increment: "patch",
                    log: progressLog,
                    project: p,
                });
                if (incrementResult.code) {
                    throw new Error(incrementResult.message || "version incrementer failed");
                }
            } catch (e) {
                const message = `Failed to increment version on branch '${branch}' for ${slug}: ${e.message}`;
                logger.error(message);
                progressLog.write(message);
                return { code: 1, message };
            }

            if (await p.isClean()) {
                const message = `Project versioner made no changes on branch '${branch}' for ${slug}`;
                progressLog.write(message);
                return { code: 0, message };
            }

            try {
                progressLog.write(`Committing version increment on branch '${branch}' for ${slug}`);
                await p.commit(`Version: increment after ${versionRelease} release\n\n[atomist:generated]`);
                await p.push();
            } catch (e) {
                const message = `Failed to increment version on branch '${branch}' for ${slug}: ${e.message}`;
                logger.error(message);
                progressLog.write(message);
                return { code: 1, message };
            }

            return { code: 0, message: `Successfully incremented version on branch '${branch}' for ${slug}` };
        });
    };
}
