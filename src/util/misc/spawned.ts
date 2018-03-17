import { logger } from "@atomist/automation-client";
import { ChildProcess } from "child_process";
import { ProgressLog } from "../../spi/log/ProgressLog";

import * as strip_ansi from "strip-ansi";

export type ErrorFinder = (code: number, signal: string, log: ProgressLog) => boolean;

export interface ChildProcessResult {
    error: boolean;
    code: number;
}

export interface SpawnWatchOptions {
    errorFinder: ErrorFinder;
    stripAnsi: boolean;
}

/**
 * Handle the result of a spawned process, streaming back
 * output to log
 * @param {"child_process".ChildProcess} childProcess
 * @param {ProgressLog} log
 * @param {ErrorFinder} errorFinder
 * @return {Promise<ChildProcessResult>}
 */
export function watchSpawned(childProcess: ChildProcess,
                             log: ProgressLog,
                             opts: Partial<SpawnWatchOptions> = {}): Promise<ChildProcessResult> {
    return new Promise<ChildProcessResult>((resolve, reject) => {
        const optsToUse = {
            errorFinder: code => code !== 0,
            stripAnsi: false,
            ...opts,
        };

        function toLog(data) {
            return optsToUse.stripAnsi ? strip_ansi(data.toString()) : data.toString();
        }

        childProcess.stdout.on("data", data => {
            log.write(toLog(data));
        });
        childProcess.stderr.on("data", data => {
            log.write(toLog(data));
        });
        childProcess.addListener("exit", (code, signal) => {
            resolve({
                error: opts.errorFinder(code, signal, log),
                code,
            });
        });
        childProcess.addListener("error", err => {
            logger.warn("Spawn failure: %s", err);
            reject(err);
        });
    });
}

/**
 * The first two arguments to spawn
 */
export interface SpawnCommand {

    command: string;
    args?: string[];
}

/**
 * Convenient function to create a spawn command from a sentence such as "npm run compile"
 * @param {string} sentence
 * @return {SpawnCommand}
 */
export function asSpawnCommand(sentence: string): SpawnCommand {
    const split = sentence.split(" ");
    return {
        command: split[0],
        args: split.slice(1),
    };
}
