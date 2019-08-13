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
import { CommandRegistration } from "../../../api/registration/CommandRegistration";
import { CreateJob } from "../../../typings/types";

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

    const owner = registration || configurationValue<string>("name");

    const data = _.cloneDeep(_.get(ctx, "trigger") || {});
    data.secrets = [];

    const cmd = typeof command === "string" ? command : command.name;
    let params = (Array.isArray(parameters) ? parameters : [parameters]).filter(p => !!p);
    if (params.length === 0) {
       params = [{}] as T[];
    }

    const result = await ctx.graphClient.mutate<CreateJob.Mutation, CreateJob.Variables>({
        name: "CreateJob",
        variables: {
            name: !!name ? name : cmd,
            description: !!description ? description : `Executing ${codeLine(cmd)}`,
            owner,
            data: JSON.stringify(data),
            tasks: params.map(p => ({
                name: cmd,
                data: JSON.stringify({
                    type: JobTaskType.Command,
                    parameters: p,
                }),
            })),
        },
        options: MutationNoCacheOptions,
    });

    return { id: result.createAtmJob.id };
}
