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
    spawnLog,
    SpawnLogOptions,
    SpawnLogResult,
} from "../misc/child_process";
import { ProjectListenerInvocation } from "./../../api/listener/ProjectListener";

/**
 * Convenience access to running child processes in the context of a local project
 */
export interface ChildProcessOnProject {

    /**
     * Spawn a child process, by default setting cwd to the directory
     * of the local project and using the progressLog of
     * GoalInvocation as logger.  Any `cwd` passed in the options
     * overrides the default.  See [[spawnLog]] for more details.
     *
     * @param cmd Command to spawn
     * @param args Arguments to command
     * @param opts Spawn options
     * @returns Command result
     */
    spawn(cmd: string, args?: string | string[], opts?: SpawnLogOptions): Promise<SpawnLogResult>;

    /**
     * Spawn a child process, by default setting cwd to the directory
     * of the local project.  Any `cwd` passed in the options
     * overrides the default.  See [[execPromise]] for more details.
     *
     * @param cmd Command to spawn
     * @param args Arguments to command
     * @param opts Spawn options
     * @returns Command standard output and standard error
     */
    exec(cmd: string, args?: string | string[], opts?: SpawnSyncOptions): Promise<ExecPromiseResult>;
}

/**
 * Type providing access to the GoalInvocation, Project and running
 * child process in the context of the project.
 */
export type ProjectAwareGoalInvocation = GoalInvocation & ProjectListenerInvocation & ChildProcessOnProject;

/**
 * Convenience method to create project aware goal invocations with
 * spawn and exec functions that, by default, use the cloned project
 * base directory as the current working directory.
 *
 * @param project locally cloned project
 * @param gi SDM goal invocation
 * @return goal invocation made project aware
 */
export function toProjectAwareGoalInvocation(project: GitProject, gi: GoalInvocation): ProjectAwareGoalInvocation {
    const { progressLog } = gi;
    const spawn = pagiSpawn(project, progressLog);
    const exec = pagiExec(project);
    return { ...gi, project, spawn, exec };
}

/**
 * Convenience method to create goal implementations that require a local clone of the project.
 * @param {(pa: ProjectGoalInvocation) => Promise<ExecuteGoalResult>} action
 * @param {CloneOptions & {readOnly: boolean}} cloneOptions
 * @returns {ExecuteGoal}
 */
export function doWithProject(action: (pa: ProjectAwareGoalInvocation) => Promise<void | ExecuteGoalResult>,
                              cloneOptions: CloneOptions & { readOnly: boolean } = { readOnly: false }): ExecuteGoal {
    return gi => {
        const { context, credentials, id, configuration, progressLog } = gi;
        return configuration.sdm.projectLoader.doWithProject({
            context,
            credentials,
            id,
            readOnly: cloneOptions.readOnly,
            cloneOptions,
        }, (p: GitProject) => action({ ...gi, project: p, spawn: pagiSpawn(p, progressLog), exec: pagiExec(p) }));
    };
}

/**
 * Return spawn function for project-aware goal invocations.
 */
function pagiSpawn(p: GitProject, log: ProgressLog): (cmd: string, args?: string | string[], opts?: SpawnLogOptions) => Promise<SpawnLogResult> {
    return (cmd: string, args: string | string[] = [], opts?: SpawnLogOptions) => {
        const optsToUse: SpawnLogOptions = {
            cwd: p.baseDir,
            log,
            ...opts,
        };
        return spawnLog(cmd, toStringArray(args), optsToUse);
    };
}

/**
 * Return exec function for project-aware goal invocations.
 */
function pagiExec(p: GitProject): (cmd: string, args?: string | string[], opts?: SpawnSyncOptions) => Promise<ExecPromiseResult> {
    return (cmd: string, args: string | string[] = [], opts: SpawnSyncOptions = {}) => {
        const optsToUse: SpawnSyncOptions = {
            cwd: p.baseDir,
            ...opts,
        };
        return execPromise(cmd, toStringArray(args), optsToUse);
    };
}
