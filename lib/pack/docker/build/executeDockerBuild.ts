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
import * as _ from "lodash";
import * as os from "os";
import * as path from "path";
import { LoggingProgressLog } from "../../../api-helper/log/LoggingProgressLog";
import { StringCapturingProgressLog } from "../../../api-helper/log/StringCapturingProgressLog";
import { spawnLog } from "../../../api-helper/misc/child_process";
import { projectConfigurationValue } from "../../../api-helper/project/configuration/projectConfiguration";
import { doWithProject, ProjectAwareGoalInvocation } from "../../../api-helper/project/withProject";
import { ExecuteGoalResult } from "../../../api/goal/ExecuteGoalResult";
import { ExecuteGoal } from "../../../api/goal/GoalInvocation";
import { mergeOptions } from "../../../api/goal/GoalWithFulfillment";
import { SdmGoalEvent } from "../../../api/goal/SdmGoalEvent";
import { executeAll, GitProject, HandlerContext, QueryNoCacheOptions, Success } from "../../../client";
import { readSdmVersion } from "../../../core/delivery/build/local/projectVersioner";
import { toArray } from "../../../core/util/misc/array";
import { postLinkImageWebhook } from "../../../core/util/webhook/ImageLink";
import { DockerRegistryProviderAll, Password } from "../../../typings/types";
import { cleanImageName } from "../support/name";
import { DockerOptions, DockerRegistry } from "./DockerBuild";

export type DockerImageNameCreator = (
    p: GitProject,
    sdmGoal: SdmGoalEvent,
    options: DockerOptions,
    ctx: HandlerContext,
) => Promise<Array<{ registry: string; name: string; tags: string[] }>>;

/**
 * Execute a Docker build for the project
 */
export function executeDockerBuild(options: DockerOptions): ExecuteGoal {
    return doWithProject(
        async gi => {
            const { goalEvent, context, project } = gi;

            const optsToUse = mergeOptions<DockerOptions>(options, {}, "docker.build");

            switch (optsToUse.builder) {
                case "docker":
                    await checkIsBuilderAvailable("docker", "help");
                    break;
                case "kaniko":
                    await checkIsBuilderAvailable("/kaniko/executor", "--help");
                    break;
            }

            // Check the graph for registries if we don't have any configured
            if (!optsToUse.config && toArray(optsToUse.registry || []).length === 0) {
                optsToUse.registry = await readRegistries(context);
            }

            const imageNames = await optsToUse.dockerImageNameCreator(project, goalEvent, optsToUse, context);
            const images = _.flatten(
                imageNames.map(imageName =>
                    imageName.tags.map(
                        tag => `${imageName.registry ? `${imageName.registry}/` : ""}${imageName.name}:${tag}`,
                    ),
                ),
            );
            const dockerfilePath = await (optsToUse.dockerfileFinder
                ? optsToUse.dockerfileFinder(project)
                : "Dockerfile");

            let externalUrls: ExecuteGoalResult["externalUrls"] = [];
            if (await pushEnabled(gi, optsToUse)) {
                externalUrls = getExternalUrls(imageNames, optsToUse);
            }

            // 1. run docker login
            let result: ExecuteGoalResult = await dockerLogin(optsToUse, gi);

            if (result.code !== 0) {
                return result;
            }

            if (optsToUse.builder === "docker") {
                result = await buildWithDocker(images, dockerfilePath, gi, optsToUse);

                if (result.code !== 0) {
                    return result;
                }
            } else if (optsToUse.builder === "kaniko") {
                result = await buildWithKaniko(images, imageNames, dockerfilePath, gi, optsToUse);

                if (result.code !== 0) {
                    return result;
                }
            }

            // 4. create image link
            if (
                await postLinkImageWebhook(
                    goalEvent.repo.owner,
                    goalEvent.repo.name,
                    goalEvent.sha,
                    images[0],
                    context.workspaceId,
                )
            ) {
                return {
                    ...result,
                    externalUrls,
                };
            } else {
                return { code: 1, message: "Image link failed" };
            }
        },
        {
            readOnly: true,
            detachHead: false,
        },
    );
}

async function buildWithDocker(
    images: string[],
    dockerfilePath: string,
    gi: ProjectAwareGoalInvocation,
    optsToUse: DockerOptions,
): Promise<ExecuteGoalResult> {
    // 2. run docker build
    const tags = _.flatten(images.map(i => ["-t", i]));

    let result: ExecuteGoalResult = await gi.spawn(
        "docker",
        ["build", "-f", dockerfilePath, ...tags, ...optsToUse.builderArgs, optsToUse.builderPath],
        {
            env: {
                ...process.env,
                DOCKER_CONFIG: dockerConfigPath(optsToUse, gi.goalEvent),
            },
            log: gi.progressLog,
        },
    );

    // 3. run docker push
    result = await dockerPush(images, optsToUse, gi);

    if (result.code !== 0) {
        return result;
    }

    return result;
}

async function buildWithKaniko(
    images: string[],
    imageNames: Array<{ registry: string; name: string; tags: string[] }>,
    dockerfilePath: string,
    gi: ProjectAwareGoalInvocation,
    optsToUse: DockerOptions,
): Promise<ExecuteGoalResult> {
    // 2. run kaniko build
    const builderArgs: string[] = [];

    if (await pushEnabled(gi, optsToUse)) {
        builderArgs.push(
            ...images.map(i => `-d=${i}`),
            "--cache=true",
            `--cache-repo=${imageNames[0].registry ? `${imageNames[0].registry}/` : ""}${imageNames[0].name}-cache`,
        );
    } else {
        builderArgs.push("--no-push");
    }
    builderArgs.push(
        ...(optsToUse.builderArgs.length > 0 ? optsToUse.builderArgs : ["--snapshotMode=time", "--reproducible"]),
    );

    // Check if base image cache dir is available
    const cacheFilPath = _.get(gi, "configuration.sdm.cache.path", "/opt/data");
    if (_.get(gi, "configuration.sdm.cache.enabled") === true && (await fs.pathExists(cacheFilPath))) {
        const baseImageCache = path.join(cacheFilPath, "base-image-cache");
        await fs.mkdirs(baseImageCache);
        builderArgs.push(`--cache-dir=${baseImageCache}`, "--cache=true");
    }

    const kanikoContext =
        `dir://${gi.project.baseDir}` + (optsToUse.builderPath === "." ? "" : `/${optsToUse.builderPath}`);
    return gi.spawn(
        "/kaniko/executor",
        ["--dockerfile", dockerfilePath, "--context", kanikoContext, ..._.uniq(builderArgs)],
        {
            env: {
                ...process.env,
                DOCKER_CONFIG: dockerConfigPath(optsToUse, gi.goalEvent),
            },
            log: gi.progressLog,
        },
    );
}

async function dockerLogin(options: DockerOptions, gi: ProjectAwareGoalInvocation): Promise<ExecuteGoalResult> {
    const registries = toArray(options.registry || []).filter(r => !!r.user && !!r.password);
    if (registries.length > 0) {
        let result;
        for (const registry of registries) {
            gi.progressLog.write("Running 'docker login'");
            const loginArgs: string[] = ["login", "--username", registry.user, "--password", registry.password];
            if (/[^A-Za-z0-9]/.test(registry.registry)) {
                loginArgs.push(registry.registry);
            }
            // 2. run docker login
            result = await gi.spawn("docker", loginArgs, {
                logCommand: false,
                log: gi.progressLog,
            });
            if (!!result && result.code !== 0) {
                return result;
            }
        }
        return result;
    } else if (options.config) {
        gi.progressLog.write("Authenticating with provided Docker 'config.json'");
        const dockerConfig = path.join(dockerConfigPath(options, gi.goalEvent), "config.json");
        await fs.ensureDir(path.dirname(dockerConfig));
        await fs.writeFile(dockerConfig, options.config);
    } else {
        gi.progressLog.write("Skipping 'docker auth' because no credentials configured");
    }
    return Success;
}

async function dockerPush(
    images: string[],
    options: DockerOptions,
    gi: ProjectAwareGoalInvocation,
): Promise<ExecuteGoalResult> {
    let result = Success;

    if (await pushEnabled(gi, options)) {
        if (!!options.concurrentPush) {
            const results = await executeAll(
                images.map(image => async () => {
                    const log = new StringCapturingProgressLog();
                    const r = await gi.spawn("docker", ["push", image], {
                        env: {
                            ...process.env,
                            DOCKER_CONFIG: dockerConfigPath(options, gi.goalEvent),
                        },
                        log,
                    });
                    gi.progressLog.write(log.log);
                    return r;
                }),
            );
            return {
                code: results.some(r => !!r && r.code !== 0) ? 1 : 0,
            };
        } else {
            for (const image of images) {
                result = await gi.spawn("docker", ["push", image], {
                    env: {
                        ...process.env,
                        DOCKER_CONFIG: dockerConfigPath(options, gi.goalEvent),
                    },
                    log: gi.progressLog,
                });

                if (!!result && result.code !== 0) {
                    return result;
                }
            }
        }
    } else {
        gi.progressLog.write("Skipping 'docker push'");
    }

    return result;
}

export const DefaultDockerImageNameCreator: DockerImageNameCreator = async (p, sdmGoal, options, context) => {
    const name = cleanImageName(p.name);
    const tags: string[] = [];
    const version = await readSdmVersion(
        sdmGoal.repo.owner,
        sdmGoal.repo.name,
        sdmGoal.repo.providerId,
        sdmGoal.sha,
        sdmGoal.branch,
        context,
    );

    if (!!version) {
        tags.push(version);
    }

    const latestTag = await projectConfigurationValue<boolean>("docker.tag.latest", p, false);
    if ((latestTag && sdmGoal.branch === sdmGoal.push.repo.defaultBranch) || tags.length === 0) {
        tags.push("latest");
    }

    if (!!options.registry) {
        return toArray(options.registry).map(r => ({
            registry: !!r.registry ? r.registry : undefined,
            name,
            tags,
        }));
    } else {
        return [
            {
                registry: undefined,
                name,
                tags,
            },
        ];
    }
};

async function checkIsBuilderAvailable(cmd: string, ...args: string[]): Promise<void> {
    try {
        await spawnLog(cmd, args, { log: new LoggingProgressLog("docker-build-check") });
    } catch (e) {
        throw new Error(`Configured Docker image builder '${cmd}' is not available`);
    }
}

async function pushEnabled(gi: ProjectAwareGoalInvocation, options: DockerOptions): Promise<boolean> {
    let push = false;
    // tslint:disable-next-line:no-boolean-literal-compare
    if (options.push === true || options.push === false) {
        push = options.push;
    } else if (toArray(options.registry || []).some(r => !!r.user && !!r.password) || !!options.config) {
        push = true;
    }
    return projectConfigurationValue("docker.build.push", gi.project, push);
}

function dockerConfigPath(options: DockerOptions, goalEvent: SdmGoalEvent): string {
    if (!!options.config) {
        return path.join(os.homedir(), `.docker-${goalEvent.goalSetId}`);
    } else {
        return path.join(os.homedir(), ".docker");
    }
}

function getExternalUrls(
    images: Array<{ registry: string; name: string; tags: string[] }>,
    options: DockerOptions,
): ExecuteGoalResult["externalUrls"] {
    const externalUrls = images.map(i => {
        const reg = toArray(options.registry || []).find(r => r.registry === i.registry);
        if (!!reg && !!reg.display) {
            return i.tags.map(t => {
                let url = `${!!reg.displayUrl ? reg.displayUrl : i.registry}/${i.name}`;

                if (!!reg.displayBrowsePath) {
                    const replace = url.split(":").pop();
                    url = url.replace(`:${replace}`, reg.displayBrowsePath);
                }
                if (!!reg.label) {
                    return { label: reg.label, url };
                } else {
                    return { url };
                }
            });
        }
        return undefined;
    });

    return _.uniqBy(
        _.flatten(externalUrls).filter(u => !!u),
        "url",
    );
}

async function readRegistries(ctx: HandlerContext): Promise<DockerRegistry[]> {
    const registries: DockerRegistry[] = [];

    const dockerRegistries = await ctx.graphClient.query<
        DockerRegistryProviderAll.Query,
        DockerRegistryProviderAll.Variables
    >({
        name: "DockerRegistryProviderAll",
        options: QueryNoCacheOptions,
    });

    if (!!dockerRegistries && !!dockerRegistries.DockerRegistryProvider) {
        for (const dockerRegistry of dockerRegistries.DockerRegistryProvider) {
            const credential = await ctx.graphClient.query<Password.Query, Password.Variables>({
                name: "Password",
                variables: {
                    id: dockerRegistry.credential.id,
                },
            });

            // Strip out the protocol
            const registryUrl = new URL(dockerRegistry.url);

            registries.push({
                registry: registryUrl.host,
                user: credential.Password[0].owner.login,
                password: credential.Password[0].secret,
                label: dockerRegistry.name,
                display: false,
            });
        }
    }

    return registries;
}
