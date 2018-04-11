/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { HandlerContext } from "@atomist/automation-client";
import { Project } from "@atomist/automation-client/project/Project";
import { DockerOptions } from "../../../software-delivery-machine/parts/stacks/dockerSupport";
import { StatusForExecuteGoal } from "../../../typings/types";
import { spawnAndWatch } from "../../../util/misc/spawned";
import { postLinkImageWebhook } from "../../../util/webhook/ImageLink";
import { ProjectLoader } from "../../repo/ProjectLoader";
import { readSdmVersion } from "../build/local/projectVersioner";
import { ExecuteGoalResult } from "../goals/goalExecution";
import {
    ExecuteGoalWithLog,
    RunWithLogContext,
} from "../goals/support/reportGoalError";

export type DockerImageNameCreator = (p: Project,
                                      status: StatusForExecuteGoal.Fragment,
                                      options: DockerOptions,
                                      ctx: HandlerContext) => Promise<{registry: string, name: string, version: string}>;

/**
 * Execute a Docker build for the project available from provided projectLoader
 * @param {ProjectLoader} projectLoader
 * @param {DockerImageNameCreator} imageNameCreator
 * @param {DockerOptions} options
 * @returns {ExecuteGoalWithLog}
 */
export function executeDockerBuild(projectLoader: ProjectLoader,
                                   imageNameCreator: DockerImageNameCreator,
                                   options: DockerOptions): ExecuteGoalWithLog {
    return async (rwlc: RunWithLogContext): Promise<ExecuteGoalResult> => {
        const { status, credentials, id, context, progressLog } = rwlc;

        return projectLoader.doWithProject({ credentials, id, context, readOnly: true }, async p => {
            const opts = {
                cwd: p.baseDir,
            };

            const spOpts = {
                errorFinder: code => code !== 0,
            };

            const imageName = await imageNameCreator(p, status, options, context);
            const image = `${imageName.registry}/${imageName.name}:${imageName.version}`;

            // 1. run docker build
            let result = await spawnAndWatch(
                {
                    command: "docker",
                    args: ["build", ".", "-t", image],
                },
                opts,
                progressLog,
                spOpts);

            if (result.code !== 0) {
                return result;
            }

            // 2. run docker login
            result = await spawnAndWatch(
                {
                    command: "docker",
                    args: ["login", "--username", options.user, "--password", options.password, options.registry],
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
                return { code: 1, message: "Image link failed"};
            }
        });
    };
}

export const DefaultDockerImageNameCreator: DockerImageNameCreator = async (p, status, options, context) => {
    const name = p.name;
    const commit = status.commit;
    const version = await readSdmVersion(commit.repo.owner, commit.repo.name,
        commit.repo.org.provider.providerId, commit.sha, context);
    return {
        registry: options.registry,
        name,
        version,
    };
};
