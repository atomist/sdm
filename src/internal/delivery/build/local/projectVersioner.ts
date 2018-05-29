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

import {
    HandlerContext,
    Success,
} from "@atomist/automation-client";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { addressEvent } from "@atomist/automation-client/spi/message/MessageClient";
import * as _ from "lodash";
import { ExecuteGoalResult } from "../../../../api/goal/ExecuteGoalResult";
import {
    ExecuteGoalWithLog,
    RunWithLogContext,
} from "../../../../api/goal/ExecuteGoalWithLog";
import {
    SdmVersion,
    SdmVersionRootType,
} from "../../../../ingesters/sdmVersionIngester";
import { ProgressLog } from "../../../../spi/log/ProgressLog";
import { ProjectLoader } from "../../../../spi/project/ProjectLoader";
import {
    SdmVersionForCommit,
    StatusForExecuteGoal,
} from "../../../../typings/types";

export type ProjectVersioner =
    (status: StatusForExecuteGoal.Fragment, p: GitProject, log: ProgressLog) => Promise<string>;

/**
 * Version the project with a build specific version number
 * @param projectLoader used to load projects
 */
export function executeVersioner(projectLoader: ProjectLoader,
                                 projectVersioner: ProjectVersioner): ExecuteGoalWithLog {
    return async (rwlc: RunWithLogContext): Promise<ExecuteGoalResult> => {
        const { status, credentials, id, context, progressLog } = rwlc;

        return projectLoader.doWithProject({ credentials, id, context, readOnly: false }, async p => {
            const version = await projectVersioner(status, p, progressLog);
            const sdmVersion: SdmVersion = {
                sha: status.commit.sha,
                branch: id.branch,
                version,
                repo: {
                    owner: status.commit.repo.owner,
                    name: status.commit.repo.name,
                    providerId: status.commit.repo.org.provider.providerId,
                },
            };
            await context.messageClient.send(sdmVersion, addressEvent(SdmVersionRootType));
            return Success;
        });
    };
}

export async function readSdmVersion(owner: string,
                                     name: string,
                                     providerId: string,
                                     sha: string,
                                     branch: string,
                                     context: HandlerContext): Promise<string> {
    const version = await context.graphClient.query<SdmVersionForCommit.Query, SdmVersionForCommit.Variables>({
            name: "SdmVersionForCommit",
            variables: {
                name: [name],
                owner: [owner],
                providerId: [providerId],
                sha: [sha],
                branch: [branch],
            },
        });
    return _.get(version, "SdmVersion[0].version");
}
