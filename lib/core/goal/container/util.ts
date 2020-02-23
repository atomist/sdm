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

import { MutationNoCacheOptions } from "@atomist/automation-client/lib/spi/graph/GraphClient";
import { LeveledLogMethod } from "@atomist/automation-client/lib/util/logger";
import * as fs from "fs-extra";
import * as _ from "lodash";
import * as path from "path";
import { SdmContext } from "../../../api/context/SdmContext";
import { ExecuteGoalResult } from "../../../api/goal/ExecuteGoalResult";
import { GoalInvocation } from "../../../api/goal/GoalInvocation";
import { SdmGoalEvent } from "../../../api/goal/SdmGoalEvent";
import { ProgressLog } from "../../../spi/log/ProgressLog";
import {
    OnBuildCompleteForDryRun,
    PushFields,
    UpdateSdmVersionMutation,
    UpdateSdmVersionMutationVariables,
} from "../../../typings/types";
import { SdmVersion } from "../../ingesters/sdmVersionIngester";
import { getGoalVersion } from "../../internal/delivery/build/local/projectVersioner";
import { K8sNamespaceFile } from "../../pack/k8s/support/namespace";
import {
    postBuildWebhook,
    postLinkImageWebhook,
} from "../../util/webhook/ImageLink";
import {
    ContainerInput,
    ContainerOutput,
    ContainerProjectHome,
} from "./container";
import Images = PushFields.Images;
import Build = OnBuildCompleteForDryRun.Build;

/**
 * Simple test to see if SDM is running in Kubernetes.  It is called
 * from a non-async function, so it must be non-async.
 *
 * @return `true` if process is running in Kubernetes, `false` otherwise.
 */
export function runningInK8s(): boolean {
    return fs.pathExistsSync(K8sNamespaceFile);
}

/**
 * Simple test to see if SDM is running as a Google Cloud Function.
 *
 * @return `true` if process is running as Google Cloud Function,
 * `false` otherwise.
 */
export function runningAsGoogleCloudFunction(): boolean {
    return !!process.env.K_SERVICE && !!process.env.K_REVISION;
}

/**
 * Return environment variables required by the container goal
 * execution machinery.
 *
 * @param goalEvent SDM goal event being executed as a container goal
 * @param ctx SDM context for goal execution
 * @return SDM goal environment variables
 */
export async function containerEnvVars(goalEvent: SdmGoalEvent,
                                       ctx: SdmContext,
                                       projectDir: string = ContainerProjectHome,
                                       inputDir: string = ContainerInput,
                                       outputDir: string = ContainerOutput): Promise<Array<{ name: string, value: string }>> {
    const version = await getGoalVersion({
        owner: goalEvent.repo.owner,
        repo: goalEvent.repo.name,
        providerId: goalEvent.repo.providerId,
        sha: goalEvent.sha,
        branch: goalEvent.branch,
        context: ctx.context,
    });
    // This should probably go into a different place but ok for now
    if (!!version) {
        _.set(goalEvent, "push.after.version", version);
    }
    return [{
        name: "ATOMIST_WORKSPACE_ID",
        value: ctx.context.workspaceId,
    }, {
        name: "ATOMIST_SLUG",
        value: `${goalEvent.repo.owner}/${goalEvent.repo.name}`,
    }, {
        name: "ATOMIST_OWNER",
        value: goalEvent.repo.owner,
    }, {
        name: "ATOMIST_REPO",
        value: goalEvent.repo.name,
    }, {
        name: "ATOMIST_SHA",
        value: goalEvent.sha,
    }, {
        name: "ATOMIST_BRANCH",
        value: goalEvent.branch,
    }, {
        name: "ATOMIST_VERSION",
        value: version,
    }, {
        name: "ATOMIST_GOAL",
        value: `${inputDir}/goal.json`,
    }, {
        name: "ATOMIST_RESULT",
        value: `${outputDir}/result.json`,
    }, {
        name: "ATOMIST_INPUT_DIR",
        value: inputDir,
    }, {
        name: "ATOMIST_OUTPUT_DIR",
        value: outputDir,
    }, {
        name: "ATOMIST_PROJECT_DIR",
        value: projectDir,
    }].filter(e => !!e.value);
}

export async function prepareInputAndOutput(input: string, output: string, gi: GoalInvocation): Promise<void> {
    try {
        await fs.emptyDir(input);
    } catch (e) {
        e.message = `Failed to empty directory '${input}'`;
        throw e;
    }
    try {
        await fs.writeJson(path.join(input, "goal.json"), gi.goalEvent, { spaces: 2 });
    } catch (e) {
        e.message = `Failed to write metadata to '${input}'`;
        try {
            await fs.remove(input);
        } catch (err) {
            e.message += `; Failed to clean up '${input}': ${err.message}`;
        }
        throw e;
    }
    try {
        await fs.emptyDir(output);
    } catch (e) {
        e.message = `Failed to empty directory '${output}'`;
        throw e;
    }
}

/**
 * Write to client and progress logs.  Add newline to progress log.
 *
 * @param msg Message to write, should not have newline at end
 * @param l Logger method, e.g., `logger.warn`
 * @param p Progress log
 */
export function loglog(msg: string, l: LeveledLogMethod, p: ProgressLog): void {
    l(msg);
    p.write(msg + "\n");
}

export async function processResult(result: any,
                                    gi: GoalInvocation): Promise<ExecuteGoalResult | undefined> {
    const { goalEvent, context } = gi;
    if (!!result) {
        if (result.SdmGoal) {
            const goal = result.SdmGoal as SdmGoalEvent;
            const r = {
                state: goal.state,
                phase: goal.phase,
                description: goal.description,
                externalUrls: goal.externalUrls,
                data: convertData(goal.data),
            };

            const builds = _.get(goal, "push.builds") as Build[];
            if (!!builds) {
                for (const build of builds) {
                    await postBuildWebhook(
                        goalEvent.repo.owner,
                        goalEvent.repo.name,
                        goalEvent.branch,
                        goalEvent.sha,
                        build.status as any,
                        context.workspaceId);
                }
            }

            const images = _.get(goal, "push.after.images") as Images[];
            if (!!images) {
                for (const image of images) {
                    await postLinkImageWebhook(
                        goalEvent.repo.owner,
                        goalEvent.repo.name,
                        goalEvent.sha,
                        image.imageName,
                        context.workspaceId,
                    );
                }
            }
            const version = _.get(goal, "push.after.version");
            if (!!version) {
                const sdmVersion: SdmVersion = {
                    sha: goalEvent.sha,
                    branch: gi.goalEvent.branch,
                    version,
                    repo: {
                        owner: goalEvent.repo.owner,
                        name: goalEvent.repo.name,
                        providerId: goalEvent.repo.providerId,
                    },
                };
                await gi.context.graphClient.mutate<UpdateSdmVersionMutation, UpdateSdmVersionMutationVariables>({
                    name: "UpdateSdmVersion",
                    variables: {
                        version: sdmVersion,
                    },
                    options: MutationNoCacheOptions,
                });
            }

            return r;
        } else {
            return {
                ...result,
                data: convertData(result.data),
            };
        }
    }
    return undefined;
}

function convertData(data: any): string {
    return !!data && typeof data !== "string" ? JSON.stringify(data) : data;
}
