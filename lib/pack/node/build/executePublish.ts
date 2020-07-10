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

import { HandlerResult, Success } from "@atomist/automation-client/lib/HandlerResult";
import { GitHubRepoRef } from "@atomist/automation-client/lib/operations/common/GitHubRepoRef";
import { GitProject } from "@atomist/automation-client/lib/project/git/GitProject";
import * as fs from "fs-extra";
import * as p from "path";
import { LoggingProgressLog } from "../../../api-helper/log/LoggingProgressLog";
import { spawnLog } from "../../../api-helper/misc/child_process";
import { projectConfigurationValue } from "../../../api-helper/project/configuration/projectConfiguration";
import { doWithProject } from "../../../api-helper/project/withProject";
import { ExecuteGoalResult } from "../../../api/goal/ExecuteGoalResult";
import { ExecuteGoal } from "../../../api/goal/GoalInvocation";
import { ProjectIdentifier } from "../../../core";
import * as github from "../../../core/util/github/ghub";
import { SdmGoalState } from "../../../typings/types";
import { NodeConfiguration } from "../nodeSupport";

/**
 * Execute npm publish
 *
 * Tags with branch-name unless the `tag` option is specified. If the branch === the repo's default branch
 * also the next tags is being set
 *
 * @param  projectLoader
 * @param  projectIdentifier
 * @param  preparations
 * @return {ExecuteGoal}
 */
export function executePublish(projectIdentifier: ProjectIdentifier, options: NpmOptions): ExecuteGoal {
    return doWithProject(async goalInvocation => {
        const { credentials, id, project, goalEvent } = goalInvocation;
        if (
            !(await projectConfigurationValue<NodeConfiguration["npm"]["publish"]["enabled"]>(
                "npm.publish.enabled",
                project,
                true,
            ))
        ) {
            return {
                code: 0,
                description: "Publish disabled",
                state: SdmGoalState.success,
            };
        }

        await configureNpmRc(options, project);

        const args: string[] = ["publish"];
        if (!!options.registry) {
            args.push("--registry", options.registry);
        }
        const access = await projectConfigurationValue<NodeConfiguration["npm"]["publish"]["access"]>(
            "npm.publish.access",
            project,
            options.access,
        );
        if (access) {
            args.push("--access", access);
        }
        if (!!options.tag) {
            args.push("--tag", options.tag);
        } else {
            args.push("--tag", gitBranchToNpmTag(id.branch));
        }

        let result: ExecuteGoalResult = await goalInvocation.spawn("npm", args);

        if (result.code === 0) {
            const pi = await projectIdentifier(project);

            // Additionally publish the next tag
            if (goalEvent.push.repo.defaultBranch === goalEvent.branch && options.nextTag !== false) {
                const nextArgs = ["dist-tag", "add", `${pi.name}@${pi.version}`, "next"];
                if (!!options.registry) {
                    nextArgs.push("--registry", options.registry);
                }
                result = await goalInvocation.spawn("npm", nextArgs);

                if (result.code !== 0) {
                    return result;
                }
            }

            const url = `${options.registry}/${pi.name}/-/${pi.name}-${pi.version}.tgz`;
            result.externalUrls = [
                {
                    label: "NPM package",
                    url,
                },
            ];

            if (options.status) {
                await github.createStatus(credentials, id as GitHubRepoRef, {
                    context: "npm/atomist/package",
                    description: "NPM package",
                    target_url: url,
                    state: "success",
                });
            }
        }

        return result;
    });
}

export async function deleteBranchTag(
    branch: string,
    project: GitProject,
    options: NpmOptions,
): Promise<HandlerResult> {
    const pj = await project.getFile("package.json");
    if (pj) {
        const tag = gitBranchToNpmTag(branch);
        const name = JSON.parse(await pj.getContent()).name;

        await configureNpmRc(options, project);
        const result = await spawnLog("npm", ["dist-tags", "rm", name, tag], {
            cwd: project.baseDir,
            log: new LoggingProgressLog("npm dist-tag rm"),
        });

        return result;
    }
    return Success;
}

/**
 * Create an npmrc file for the package.
 */
export async function configureNpmRc(options: NpmOptions, project: { baseDir: string }): Promise<NpmOptions> {
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
    /** Optionally tag default branch builds with the next dist-tag */
    nextTag?: boolean;
    /** Optional flag, to indicate if a status should be created on the SCM containing a link to the package */
    status?: boolean;
}

export function gitBranchToNpmTag(branchName: string): string {
    return `branch-${gitBranchToNpmVersion(branchName)}`;
}

export function gitBranchToNpmVersion(branchName: string): string {
    return branchName
        .replace(/[_/]/g, "-")
        .replace(/[^-.a-zA-Z0-9]+/g, "")
        .replace(/-+/g, "-");
}
