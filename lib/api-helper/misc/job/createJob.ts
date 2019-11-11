/*
 * Copyright © 2019 Atomist, Inc.
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
    configurationValue,
    HandlerContext,
    MutationNoCacheOptions,
    ParameterType,
} from "@atomist/automation-client";
import { codeLine } from "@atomist/slack-messages";
import * as _ from "lodash";
import {
    NoPreferenceStore,
    PreferenceStoreFactory,
} from "../../../api/context/preferenceStore";
import { CommandRegistration } from "../../../api/registration/CommandRegistration";
import {
    AddJobTasks,
    CreateJob,
    ResumeJob,
} from "../../../typings/types";

export enum JobTaskType {
    Command = "command",
}

export interface JobTask<T extends ParameterType> {
    type: JobTaskType;
    parameters: T;
}

/**
 * Details of the job to create
 */
export interface JobDetails<T extends ParameterType> {
    command: string | CommandRegistration<T>;
    registration?: string;
    parameters: T | T[];
    name?: string;
    description?: string;

    /** Optional maximum number of concurrent tasks; defaults to running all tasks in parallel */
    concurrentTasks?: number;
}

/**
 * Create a Job in the backend with the provided name and tasks
 *
 * A job can execute any registered command in the same or other connected SDM:
 *
 * command: name of the CommandRegistration or the registration instance itself
 * registration: optional name of the SDM this job should be send to; defaults to the current SDM
 * parameters: Record type with all required parameters for this command
 * name: optional name of the job
 * description: optional description of the job used to display to the user in chat or web
 */
export async function createJob<T extends ParameterType>(details: JobDetails<T>,
                                                         ctx: HandlerContext): Promise<{ id: string }> {

    const { command, parameters, name, description, registration } = details;
    const cmd = typeof command === "string" ? command : command.name;
    const nameToUse = !!name ? name : cmd;
    const owner = registration || configurationValue<string>("name");

    const preferenceStoreFactory = configurationValue<PreferenceStoreFactory>(
        "sdm.preferenceStoreFactory",
        () => NoPreferenceStore);
    const concurrentTasks = await preferenceStoreFactory(ctx).get<string>(
        `@atomist/job/${owner}/concurrentTasks`,
        { defaultValue: (details.concurrentTasks || 1).toString() });

    const data = _.cloneDeep(_.get(ctx, "trigger") || {});
    data.secrets = [];


    const params = (Array.isArray(parameters) ? parameters : [parameters]).filter(p => !!p);
    const paramsChunks = _.chunk(params, 250);

    const result = await ctx.graphClient.mutate<CreateJob.Mutation, CreateJob.Variables>({
        name: "CreateJob",
        variables: {
            name: nameToUse,
            description: !!description ? description : `Executing ${codeLine(cmd)}`,
            owner,
            data: JSON.stringify(data),
            tasks: (paramsChunks[0] || []).map(p => ({
                name: cmd,
                data: JSON.stringify({
                    type: JobTaskType.Command,
                    parameters: p,
                }),
            })),
            concurrentTasks: +concurrentTasks,
        },
        options: MutationNoCacheOptions,
    });

    if (paramsChunks.length > 1) {
        for (const paramChunk of paramsChunks.slice(1)) {
            await ctx.graphClient.mutate<AddJobTasks.Mutation, AddJobTasks.Variables>({
                name: "AddJobTasks",
                variables: {
                    id: result.createAtmJob.id,
                    tasks: paramChunk.map(p => ({
                        name: cmd,
                        data: JSON.stringify({
                            type: JobTaskType.Command,
                            parameters: p,
                        }),
                    })),
                },
                options: MutationNoCacheOptions,
            });
        }
    }

    await ctx.graphClient.mutate<ResumeJob.Mutation, ResumeJob.Variables>({
        name: "ResumeJob",
        variables: {
            id: result.createAtmJob.id,
        },
        options: MutationNoCacheOptions,
    });

    return { id: result.createAtmJob.id };
}
