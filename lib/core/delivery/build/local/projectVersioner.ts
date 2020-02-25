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

import { HandlerContext } from "@atomist/automation-client/lib/HandlerContext";
import { Success } from "@atomist/automation-client/lib/HandlerResult";
import { GitProject } from "@atomist/automation-client/lib/project/git/GitProject";
import {
    MutationNoCacheOptions,
    QueryNoCacheOptions,
} from "@atomist/automation-client/lib/spi/graph/GraphClient";
import { codeLine } from "@atomist/slack-messages";
import * as _ from "lodash";
import { ExecuteGoalResult } from "../../../../api/goal/ExecuteGoalResult";
import {
    ExecuteGoal,
    GoalInvocation,
} from "../../../../api/goal/GoalInvocation";
import { SdmGoalEvent } from "../../../../api/goal/SdmGoalEvent";
import { ProgressLog } from "../../../../spi/log/ProgressLog";
import {
    SdmVersionForCommit,
    UpdateSdmVersionMutation,
    UpdateSdmVersionMutationVariables,
} from "../../../../typings/types";
import {
    SdmVersion,
} from "../../../ingesters/sdmVersionIngester";

export type ProjectVersioner =
    (status: SdmGoalEvent, p: GitProject, log: ProgressLog) => Promise<string>;

/**
 * Version the project with a build specific version number
 * @param projectLoader used to load projects
 * @param projectVersioner decides on the version string
 */
export function executeVersioner(projectVersioner: ProjectVersioner): ExecuteGoal {
    return async (goalInvocation: GoalInvocation): Promise<ExecuteGoalResult> => {
        const { configuration, goalEvent, credentials, id, context, progressLog } = goalInvocation;

        return configuration.sdm.projectLoader.doWithProject({ credentials, id, context, readOnly: false }, async p => {
            const version = await projectVersioner(goalEvent, p, progressLog);
            const sdmVersion: SdmVersion = {
                sha: goalEvent.sha,
                branch: id.branch,
                version,
                repo: {
                    owner: goalEvent.repo.owner,
                    name: goalEvent.repo.name,
                    providerId: goalEvent.repo.providerId,
                },
            };
            await context.graphClient.mutate<UpdateSdmVersionMutation, UpdateSdmVersionMutationVariables>({
                name: "UpdateSdmVersion",
                variables: {
                    version: sdmVersion,
                },
                options: MutationNoCacheOptions,
            });
            return {
                ...Success,
                description: `Versioned ${codeLine(version)}`,
            };
        });
    };
}

/**
 * Get prerelease, i.e., timestamped, version associated with the goal
 * set for the provided goal invocation.  The Version goal must be
 * executed within the goal set prior to calling this function.
 *
 * @param gi Goal invocation
 * @return Prerelease semantic version string
 */
export async function goalInvocationVersion(gi: GoalInvocation): Promise<string | undefined> {
    return getGoalVersion({
        branch: gi.id.branch,
        context: gi.context,
        owner: gi.goalEvent.repo.owner,
        providerId: gi.goalEvent.repo.providerId,
        repo: gi.goalEvent.repo.name,
        sha: gi.goalEvent.sha,
    });
}

/** Object wrapping [[getGoalVersion]] function arguments. */
export interface GetGoalVersionArguments {
    /** Context providing a graph client. */
    context: HandlerContext;
    /** Repository owner, i.e., user or organization. */
    owner: string;
    /** Git repository provider identifier. */
    providerId: string;
    /** Repository name. */
    repo: string;
    /** Commit SHA. */
    sha: string;
    /** Branch, "master" if not provided */
    branch?: string;
}

/**
 * Read and return prerelease version for the goal set associated with
 * the provided commit.
 *
 * @param args Properties determining which version to retrieve
 * @return Prerelease semantic version string
 */
export async function getGoalVersion(args: GetGoalVersionArguments): Promise<string | undefined> {
    const branch = args.branch || "master";
    const version = await args.context.graphClient.query<SdmVersionForCommit.Query, SdmVersionForCommit.Variables>({
        name: "SdmVersionForCommit",
        variables: {
            name: [args.repo],
            owner: [args.owner],
            providerId: [args.providerId],
            sha: [args.sha],
            branch: [branch],
        },
        options: QueryNoCacheOptions,
    });
    return _.get(version, "SdmVersion[0].version");
}

/** See getGoalVersion. */
export async function readSdmVersion(owner: string,
                                     repo: string,
                                     providerId: string,
                                     sha: string,
                                     branch: string,
                                     context: HandlerContext): Promise<string | undefined> {
    return getGoalVersion({ branch, context, owner, providerId, repo, sha });
}
