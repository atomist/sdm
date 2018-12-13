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
    CloneOptions,
    GitProject,
    toStringArray,
} from "@atomist/automation-client";
import { SpawnSyncOptions } from "child_process";
import { ExecuteGoalResult } from "../../api/goal/ExecuteGoalResult";
import {
    ExecuteGoal,
    GoalInvocation,
} from "../../api/goal/GoalInvocation";
import { ProgressLog } from "../../spi/log/ProgressLog";
import {
    execPromise,
    ExecPromiseResult,
    spawnAndLog,
    SpawnLogOptions,
    SpawnLogResult,
} from "../misc/child_process";
import { ProjectListenerInvocation } from "./../../api/listener/ProjectListener";

/**
 * Convenience access to running child processes in the context of a local project
 */
export interface ChildProcessOnProject {

    /**
     * Spawn a child process, by default setting cwd to the directory of the local
     * project and using the progressLog of GoalInvocation as logger.
     * See spawnAndLog for more details.
     * @param {string} cmd
     * @param {string | string[]} args
     * @param {SpawnLogOptions} opts
     * @param {ProgressLog} log
     * @returns {Promise<SpawnLogResult>}
     */
    spawn(cmd: string, args?: string | string[], opts?: SpawnLogOptions, log?: ProgressLog): Promise<SpawnLogResult>;

    /**
     * Spawn a child process, by default setting cw to the directory of the local
     * project.
     * See execPromise for more details.
     * @param {string} cmd
     * @param {string | string[]} args
     * @param {SpawnSyncOptions} opts
     * @returns {Promise<ExecPromiseResult>}
     */
    exec(cmd: string, args?: string | string[], opts?: SpawnSyncOptions): Promise<ExecPromiseResult>;
}

/**
 * Type providing access to the GoalInvocation, Project and running child process in the context of the project
 */
export type ProjectAwareGoalInvocation = GoalInvocation & ProjectListenerInvocation & ChildProcessOnProject;

/**
 * Convenience method to create goal implementations that require a local clone of the project.
 * @param {(pa: ProjectGoalInvocation) => Promise<ExecuteGoalResult>} action
 * @param {CloneOptions & {readOnly: boolean}} cloneOptions
 * @returns {ExecuteGoal}
 */
export function doWithProject(action: (pa: ProjectAwareGoalInvocation) => Promise<ExecuteGoalResult>,
                              cloneOptions: CloneOptions & { readOnly: boolean } = { readOnly: false }): ExecuteGoal {
    return gi => {
        const { credentials, id, configuration, progressLog } = gi;

        function spawn(p: GitProject) {
            return (cmd: string,
                    args: string | string[] = [],
                    opts: SpawnLogOptions = {},
                    log: ProgressLog = progressLog) => {
                const optsToUse: SpawnLogOptions = {
                    cwd: p.baseDir,
                    ...opts,
                };
                return spawnAndLog(log, cmd, toStringArray(args), optsToUse);
            };
        }

        function exec(p: GitProject) {
            return (cmd: string,
                    args: string | string[] = [],
                    opts: SpawnSyncOptions = {}) => {
                const optsToUse: SpawnSyncOptions = {
                    cwd: p.baseDir,
                    ...opts,
                };
                return execPromise(cmd, toStringArray(args), optsToUse);
            };
        }

        return configuration.sdm.projectLoader.doWithProject({
            credentials,
            id,
            readOnly: cloneOptions.readOnly,
            cloneOptions,
        }, (p: GitProject) => action({ ...gi, project: p, spawn: spawn(p), exec: exec(p) }));
    };
}
