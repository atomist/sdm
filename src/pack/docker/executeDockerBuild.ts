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
} from "@atomist/automation-client";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { branchFromCommit } from "../../api-helper/goal/executeBuild";
import { spawnAndWatch } from "../../api-helper/misc/spawned";
import { ExecuteGoalResult } from "../../api/goal/ExecuteGoalResult";
import {
    ExecuteGoalWithLog,
    PrepareForGoalExecution,
    RunWithLogContext,
} from "../../api/goal/ExecuteGoalWithLog";
import { readSdmVersion } from "../../internal/delivery/build/local/projectVersioner";
import { ProjectLoader } from "../../spi/project/ProjectLoader";
import { StatusForExecuteGoal } from "../../typings/types";
import { postLinkImageWebhook } from "../../util/webhook/ImageLink";

export interface DockerOptions {
    registry: string;
    user: string;
    password: string;

    dockerfileFinder?: (p: GitProject) => Promise<string>;
}

export type DockerImageNameCreator = (p: GitProject,
                                      status: StatusForExecuteGoal.Fragment,
                                      options: DockerOptions,
                                      ctx: HandlerContext) => Promise<{ registry: string, name: string, version: string }>;

/**
 * Execute a Docker build for the project available from provided projectLoader
 * @param {ProjectLoader} projectLoader
 * @param {DockerImageNameCreator} imageNameCreator
 * @param {DockerOptions} options
 * @returns {ExecuteGoalWithLog}
 */
export function executeDockerBuild(projectLoader: ProjectLoader,
                                   imageNameCreator: DockerImageNameCreator,
                                   preparations: PrepareForGoalExecution[] = [],
                                   options: DockerOptions): ExecuteGoalWithLog {
    return async (rwlc: RunWithLogContext): Promise<ExecuteGoalResult> => {
        const { status, credentials, id, context, progressLog } = rwlc;

        return projectLoader.doWithProject({ credentials, id, context, readOnly: false }, async p => {

            for (const preparation of preparations) {
                const pResult = await preparation(p, rwlc);
                if (pResult.code !== 0) {
                    return pResult;
                }
            }

            const opts = {
                cwd: p.baseDir,
            };

            const spOpts = {
                errorFinder: code => code !== 0,
            };

            const imageName = await imageNameCreator(p, status, options, context);
            const image = `${imageName.registry}/${imageName.name}:${imageName.version}`;
            const dockerfilePath = await (options.dockerfileFinder ? options.dockerfileFinder(p) : "Dockerfile");

            const loginArgs: string[] = ["login", "--username", options.user, "--password", options.password];
            if (/[^A-Za-z0-9]/.test(options.registry)) {
                loginArgs.push(options.registry);
            }

            // 1. run docker login
            let result = await spawnAndWatch(
                {
                    command: "docker",
                    args: loginArgs,
                },
                opts,
                progressLog,
                spOpts);

            if (result.code !== 0) {
                return result;
            }

            // 2. run docker build
            result = await spawnAndWatch(
                {
                    command: "docker",
                    args: ["build", ".", "-f", dockerfilePath, "-t", image],
                },
                opts,
                progressLog,
                spOpts);

            if (result.code !== 0) {
                return result;
            }

            // 3. run docker push
            result = await spawnAndWatch(
                {
                    command: "docker",
                    args: ["push", image],
                },
                opts,
                progressLog,
                spOpts);

            if (result.code !== 0) {
                return result;
            }

            // 4. create image link
            if (await postLinkImageWebhook(
                status.commit.repo.owner,
                status.commit.repo.name,
                status.commit.sha,
                image,
                context.teamId)) {
                return result;
            } else {
                return { code: 1, message: "Image link failed" };
            }
        });
    };
}

export const DefaultDockerImageNameCreator: DockerImageNameCreator = async (p, status, options, context) => {
    const name = p.name;
    const commit = status.commit;
    const version = await readSdmVersion(commit.repo.owner, commit.repo.name,
        commit.repo.org.provider.providerId, commit.sha, branchFromCommit(commit), context);
    return {
        registry: options.registry,
        name,
        version,
    };
};
