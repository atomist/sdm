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

import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { gitBranchToNpmTag } from "@jessitron/git-branch-to-npm-tag/lib";
import * as fs from "fs-extra";
import * as p from "path";
import { spawnAndWatch } from "../../../../../api-helper/misc/spawned";
import { ExecuteGoalResult } from "../../../../../api/goal/ExecuteGoalResult";
import {
    ExecuteGoalWithLog,
    PrepareForGoalExecution,
    RunWithLogContext,
} from "../../../../../api/goal/ExecuteGoalWithLog";
import { ProjectLoader } from "../../../../../spi/project/ProjectLoader";
import { createStatus } from "../../../../../util/github/ghub";
import { ProjectIdentifier } from "../projectIdentifier";
import { NpmPreparations } from "./npmBuilder";

/**
 * Execute npm publish
 *
 * Tags with branch:name unless the `tag` option is specified
 *
 * @param {ProjectLoader} projectLoader
 * @param {ProjectIdentifier} projectIdentifier
 * @param {PrepareForGoalExecution[]} preparations
 * @return {ExecuteGoalWithLog}
 */
export function executePublish(
    projectLoader: ProjectLoader,
    projectIdentifier: ProjectIdentifier,
    preparations: PrepareForGoalExecution[] = NpmPreparations,
    options: NpmOptions,
): ExecuteGoalWithLog {

    return async (rwlc: RunWithLogContext): Promise<ExecuteGoalResult> => {
        const { credentials, id, context } = rwlc;
        return projectLoader.doWithProject({ credentials, id, context, readOnly: false }, async project => {
            for (const preparation of preparations) {
                const pResult = await preparation(project, rwlc);
                if (pResult.code !== 0) {
                    return pResult;
                }
            }

            await configure(options, project);

            const args = [
                p.join(__dirname, "..", "..", "..", "..", "..", "scripts", "npm-publish.bash"),
            ];
            if (options.registry) {
                args.push("--registry", options.registry);
            }
            if (options.access) {
                args.push("--access", options.access);
            }
            if (options.tag) {
                args.push("--tag", options.tag);
            } else {
                args.push("--tag", gitBranchToNpmTag(id.branch));
            }

            const result: ExecuteGoalResult = await spawnAndWatch(
                { command: "bash", args },
                { cwd: project.baseDir },
                rwlc.progressLog,
            );

            if (result.code === 0) {
                const pi = await projectIdentifier(project);
                const url = `${options.registry}/${pi.name}/-/${pi.name}-${pi.version}.tgz`;
                await createStatus(
                    credentials,
                    id as GitHubRepoRef,
                    {
                        context: "npm/atomist/package",
                        description: "NPM package",
                        target_url: url,
                        state: "success",
                    });
                result.targetUrl = url;
            }

            return result;
        });
    };
}

/**
 * Create an npmrc file for the package.
 */
async function configure(options: NpmOptions, project: GitProject): Promise<NpmOptions> {
    await fs.writeFile(p.join(project.baseDir, ".npmrc"), options.npmrc, { mode: 0o600 });
    return options;
}

/**
 * NPM options used when publishing NPM modules.
 */
export interface NpmOptions {
    /** The contents of a .npmrc file, typically containing authentication information */
    npmrc: string;
    /** Optional registry, use NPM default if not present, currently "https://registry.npmjs.org" */
    registry?: string;
    /** Optional publication access, use NPM default if not present, currently "restricted" */
    access?: "public" | "restricted";
    /** Optional publication tag, use NPM default if not present, currently "latest" */
    tag?: string;
}
