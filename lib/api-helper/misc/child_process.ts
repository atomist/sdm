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
    configurationValue,
    HandlerResult,
    logger,
    WritableLog,
} from "@atomist/automation-client";
import {
    execPromise,
    ExecPromiseError,
    ExecPromiseResult,
    killProcess,
    spawn,
    spawnPromise,
    SpawnPromiseOptions,
    SpawnPromiseReturns,
} from "@atomist/automation-client/lib/util/child_process";
import {
    ChildProcess,
    SpawnOptions,
} from "child_process";
import * as os from "os";
import * as path from "path";
import { ProgressLog } from "../../spi/log/ProgressLog";
import { DelimitedWriteProgressLogDecorator } from "../log/DelimitedWriteProgressLogDecorator";

/** Re-export child process objects from automation-client. */
export {
    execPromise,
    ExecPromiseError,
    ExecPromiseResult,
    killProcess,
    spawn,
    spawnPromise,
    SpawnPromiseOptions,
    SpawnPromiseReturns,
    WritableLog,
};

/**
 * Type that can react to the exit of a spawned child process, after
 * Node has terminated without reporting an error.  This is necessary
 * only for commands that can return a zero exit status on failure or
 * non-zero exit code on success.  Implementations should return
 * `true` if an error is found, `false` otherwise.
 */
export type ErrorFinder = (code: number, signal: string, log: WritableLog) => boolean;

/**
 * Default ErrorFinder that regards everything but a return code of 0
 * as failure.
 *
 * @param code process exit status
 * @return true if exit status is not zero
 */
export const SuccessIsReturn0ErrorFinder: ErrorFinder = code => code !== 0;

/**
 * Add an error finder to SpawnPromietOptions to allow for
 * poorly-behaved command-line tools that do not properly reflect
 * their status in their return code.
 */
export interface SpawnLogOptions extends SpawnPromiseOptions {
    /**
     * If your command can return zero on failure or non-zero on
     * success, you can override the default behavior of determining
     * success or failure using this option.  For example, if your
     * command returns zero for certain types of errors, you can scan
     * the log content from the command to determine if an error
     * occurs.  If this function finds an error, the `error` property
     * will be populated with an `Error`.
     */
    errorFinder?: ErrorFinder;
}

/**
 * Interface containing the arguments to spawnAndLog.
 */
export interface SpawnLogCommand {
    /** Executable able to be run by cross-spawn. */
    command: string;
    /** Arguments to command */
    args?: string[];
    /** Options to customize how command is run. */
    options?: SpawnLogOptions;
}

/**
 * Result returned by spawnAndLog after running a child process.  It
 * is compatible with handler results.  To support both HandlerResult
 * and SpawnPromiseReturns, the value of code and status are
 * identical.
 */
export interface SpawnLogResult extends HandlerResult, SpawnPromiseReturns { }

/**
 * Spawn a process, log its output, and return a Promise of its
 * results.  The command is spawned using cross-spawn.  A
 * DelimitedWriteProgressLogDecorator, using newlines as delimiters,
 * is created from the provided `log`.  The default command timeout is
 * 10 minutes.  The default [[SpawnLogOptions#errorFinder]] sets the
 * `error` property if the command exits with a non-zero status or is
 * killed by a signal.  If the process is killed due to a signal or
 * the `errorFinder` returns `true`, the returned `code` property will
 * be non-zero.
 *
 * @param log Logger to write stdout and stderr to
 * @param cmd Command to run.
 * @param args Arguments to command.
 * @param opts Options for spawn, spawnPromise, and spawnAndLog.
 * @return A promise that provides information on the child process and
 *         its execution result, including if the exit status was non-zero
 *         or the process was killed by a signal.  The promise is only
 *         rejected with an `ExecPromiseError` if there is an error
 *         spawning the process.
 */
export async function spawnAndLog(log: ProgressLog, cmd: string, args: string[] = [], opts: SpawnLogOptions = {}): Promise<SpawnLogResult> {

    opts.errorFinder = (opts.errorFinder) ? opts.errorFinder : SuccessIsReturn0ErrorFinder;
    opts.log = new DelimitedWriteProgressLogDecorator(log, "\n");
    opts.timeout = (opts.timeout) ? opts.timeout : configurationValue<number>("sdm.goal.timeout", 10 * 60 * 1000);

    const spResult = await spawnPromise(cmd, args, opts);
    const slResult = {
        ...spResult,
        code: (spResult.signal ? 128 + 15 : spResult.status), // if killed by signal, use SIGTERM
    };
    if (slResult.error) {
        throw ExecPromiseError.fromSpawnReturns(slResult);
    } else if (opts.errorFinder(slResult.code, slResult.signal, opts.log)) {
        slResult.code = (slResult.code) ? slResult.code : 99;
        slResult.error = new Error(`Error finder found error in results from ${slResult.cmdString}`);
    }
    return slResult;
}

/**
 * Clear provided timers, checking to make sure the timers are defined
 * before clearing them.
 *
 * @param timers the timers to clear.
 */
function clearTimers(...timers: NodeJS.Timer[]): void {
    timers.filter(t => !!t).map(t => clearTimeout(t));
}

/**
 * Kill the process and wait for it to shut down. This can take a
 * while as processes may have shut down hooks.  On win32, the process
 * is killed and the Promise is rejected if the process does not exit
 * within `wait` milliseconds.  On other platforms, first the process
 * is sent the default signal, SIGTERM.  After `wait` milliseconds, it
 * is sent SIGKILL.  After another `wait` milliseconds, an error is
 * thrown.
 *
 * @param childProcess Child process to kill
 * @param wait Number of milliseconds to wait before sending SIGKILL and
 *             then erroring, default is 30000 ms
 */
export async function killAndWait(childProcess: ChildProcess, wait: number = 30000): Promise<void> {
    return new Promise<void>((resolve, reject) => {
        const pid = childProcess.pid;
        let killTimer: NodeJS.Timer;
        const termTimer = setTimeout(() => {
            if (os.platform() === "win32") {
                reject(new Error(`Failed to kill child process ${pid} in ${wait} ms`));
            } else {
                logger.debug(`Child process ${pid} did not exit in ${wait} ms, sending SIGKILL`);
                killProcess(pid, "SIGKILL");
                killTimer = setTimeout(() => {
                    reject(new Error(`Failed to detect child process ${pid} exit after sending SIGKILL`));
                }, wait);
            }
        }, wait);
        childProcess.on("close", (code, signal) => {
            clearTimers(termTimer, killTimer);
            logger.debug(`Child process ${pid} closed with code '${code}' and signal '${signal}'`);
            resolve();
        });
        childProcess.on("exit", (code, signal) => {
            logger.debug(`Child process ${pid} exited with code '${code}' and signal '${signal}'`);
        });
        childProcess.on("error", err => {
            clearTimers(termTimer, killTimer);
            err.message = `Child process ${pid} errored: ${err.message}`;
            logger.error(err.message);
            reject(err);
        });
        killProcess(pid);
    });
}
