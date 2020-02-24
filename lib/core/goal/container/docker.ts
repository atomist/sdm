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

import { guid } from "@atomist/automation-client/lib/internal/util/string";
import { logger } from "@atomist/automation-client/lib/util/logger";
import * as fs from "fs-extra";
import * as stringify from "json-stringify-safe";
import * as _ from "lodash";
import * as os from "os";
import * as path from "path";
import { minimalClone } from "../../../api-helper/goal/minimalClone";
import {
    spawnLog,
    SpawnLogOptions,
    SpawnLogResult,
} from "../../../api-helper/misc/child_process";
import { ExecuteGoal } from "../../../api/goal/GoalInvocation";
import { ImplementationRegistration } from "../../../api/goal/GoalWithFulfillment";
import {
    Container,
    ContainerInput,
    ContainerOutput,
    ContainerProjectHome,
    ContainerRegistration,
    ContainerScheduler,
    GoalContainer,
    GoalContainerSpec,
} from "./container";
import { prepareSecrets } from "./provider";
import {
    containerEnvVars,
    prepareInputAndOutput,
    processResult,
} from "./util";

/**
 * Extension to GoalContainer to specify additional docker options
 */
export type DockerGoalContainer = GoalContainer & { dockerOptions?: string[] };

/**
 * Additional options for Docker CLI implementation of container goals.
 */
export interface DockerContainerRegistration extends ContainerRegistration {
    /**
     * Containers to run for this goal.  The goal result is based on
     * the exit status of the first element of the `containers` array.
     * The other containers are considered "sidecar" containers
     * provided functionality that the main container needs to
     * function.  The working directory of the first container is set
     * to [[ContainerProjectHome]], which contains the project upon
     * which the goal should operate.
     *
     * This extends the base containers property to be able to pass
     * additional dockerOptions to a single container, eg.
     * '--link=mongo:mongo'.
     */
    containers: DockerGoalContainer[];

    /**
     * Additional Docker CLI command-line options.  Command-line
     * options provided here will be appended to the default set of
     * options used when executing `docker run`.  For example, if your
     * main container must run in its default working directory, you
     * can include `"--workdir="` in the `dockerOptions` array.
     */
    dockerOptions?: string[];
}

export const dockerContainerScheduler: ContainerScheduler = (goal, registration: DockerContainerRegistration) => {
    goal.addFulfillment({
        goalExecutor: executeDockerJob(goal, registration),
        ...registration as ImplementationRegistration,
    });
};

interface SpawnedContainer {
    name: string;
    promise: Promise<SpawnLogResult>;
}

/**
 * Execute container goal using Docker CLI.  Wait on completion of
 * first container, then kill all the rest.
 */
export function executeDockerJob(goal: Container, registration: DockerContainerRegistration): ExecuteGoal {
    // tslint:disable-next-line:cyclomatic-complexity
    return async gi => {

        const { goalEvent, progressLog, configuration } = gi;
        const goalName = goalEvent.uniqueName.split("#")[0].toLowerCase();
        const namePrefix = "sdm-";
        const nameSuffix = `-${goalEvent.goalSetId.slice(0, 7)}-${goalName}`;

        const tmpDir = path.join(dockerTmpDir(), goalEvent.repo.owner, goalEvent.repo.name, goalEvent.goalSetId);
        const containerDir = path.join(tmpDir, `${namePrefix}tmp-${guid()}${nameSuffix}`);

        return configuration.sdm.projectLoader.doWithProject({
            ...gi,
            readOnly: false,
            cloneDir: containerDir,
            cloneOptions: minimalClone(goalEvent.push, { detachHead: true }),
        },
            // tslint:disable-next-line:cyclomatic-complexity
            async project => {
                const spec: GoalContainerSpec = {
                    ...registration,
                    ...(!!registration.callback ? await registration.callback(_.cloneDeep(registration), project, goal, goalEvent, gi) : {}),
                };

                if (!spec.containers || spec.containers.length < 1) {
                    throw new Error("No containers defined in GoalContainerSpec");
                }

                const inputDir = path.join(tmpDir, `${namePrefix}tmp-${guid()}${nameSuffix}`);
                const outputDir = path.join(tmpDir, `${namePrefix}tmp-${guid()}${nameSuffix}`);
                try {
                    await prepareInputAndOutput(inputDir, outputDir, gi);
                } catch (e) {
                    const message = `Failed to prepare input and output for goal ${goalName}: ${e.message}`;
                    progressLog.write(message);
                    return { code: 1, message };
                }

                const spawnOpts = {
                    log: progressLog,
                    cwd: containerDir,
                };

                const network = `${namePrefix}network-${guid()}${nameSuffix}`;
                let networkCreateRes: SpawnLogResult;
                try {
                    networkCreateRes = await spawnLog("docker", ["network", "create", network], spawnOpts);
                } catch (e) {
                    networkCreateRes = {
                        cmdString: `'docker' 'network' 'create' '${network}'`,
                        code: 128,
                        error: e,
                        output: [undefined, "", e.message],
                        pid: -1,
                        signal: undefined,
                        status: 128,
                        stdout: "",
                        stderr: e.message,
                    };
                }
                if (networkCreateRes.code) {
                    let message = `Failed to create Docker network '${network}'` +
                        ((networkCreateRes.error) ? `: ${networkCreateRes.error.message}` : "");
                    progressLog.write(message);
                    try {
                        await dockerCleanup({ spawnOpts });
                    } catch (e) {
                        networkCreateRes.code++;
                        message += `; ${e.message}`;
                    }
                    return { code: networkCreateRes.code, message };
                }

                const atomistEnvs = (await containerEnvVars(gi.goalEvent, gi)).map(env => `--env=${env.name}=${env.value}`);

                const spawnedContainers: SpawnedContainer[] = [];
                const failures: string[] = [];
                for (const container of spec.containers) {
                    let secrets = {
                        env: [],
                        files: [],
                    };
                    try {
                        secrets = await prepareSecrets(container, gi);
                        if (!!secrets?.files) {
                            const secretPath = path.join(inputDir, ".secrets");
                            await fs.ensureDir(secretPath);
                            for (const file of secrets.files) {
                                const secretFile = path.join(secretPath, guid());
                                file.hostPath = secretFile;
                                await fs.writeFile(secretFile, file.value);
                            }
                        }
                    } catch (e) {
                        failures.push(e.message);
                    }
                    const containerName = `${namePrefix}${container.name}${nameSuffix}`;
                    let containerArgs: string[];
                    try {
                        containerArgs = containerDockerOptions(container, registration);
                    } catch (e) {
                        progressLog.write(e.message);
                        failures.push(e.message);
                        break;
                    }
                    const dockerArgs = [
                        "run",
                        "--tty",
                        "--rm",
                        `--name=${containerName}`,
                        `--volume=${containerDir}:${ContainerProjectHome}`,
                        `--volume=${inputDir}:${ContainerInput}`,
                        `--volume=${outputDir}:${ContainerOutput}`,
                        ...secrets.files.map(f => `--volume=${f.hostPath}:${f.mountPath}`),
                        `--network=${network}`,
                        `--network-alias=${container.name}`,
                        ...containerArgs,
                        ...(registration.dockerOptions || []),
                        ...((container as DockerGoalContainer).dockerOptions || []),
                        ...atomistEnvs,
                        ...secrets.env.map(e => `--env=${e.name}=${e.value}`),
                        container.image,
                        ...(container.args || []),
                    ];
                    if (spawnedContainers.length < 1) {
                        dockerArgs.splice(5, 0, `--workdir=${ContainerProjectHome}`);
                    }
                    const promise = spawnLog("docker", dockerArgs, spawnOpts);
                    spawnedContainers.push({ name: containerName, promise });
                }
                if (failures.length > 0) {
                    try {
                        await dockerCleanup({
                            network,
                            spawnOpts,
                            containers: spawnedContainers,
                        });
                    } catch (e) {
                        failures.push(e.message);
                    }
                    return {
                        code: failures.length,
                        message: `Failed to spawn Docker containers: ${failures.join("; ")}`,
                    };
                }

                const main = spawnedContainers[0];
                try {
                    const result = await main.promise;
                    if (result.code) {
                        const msg = `Docker container '${main.name}' failed` + ((result.error) ? `: ${result.error.message}` : "");
                        progressLog.write(msg);
                        failures.push(msg);
                    }
                } catch (e) {
                    const message = `Failed to execute main Docker container '${main.name}': ${e.message}`;
                    progressLog.write(message);
                    failures.push(message);
                }

                const outputFile = path.join(outputDir, "result.json");
                let outputResult;
                if ((await fs.pathExists(outputFile)) && failures.length === 0) {
                    try {
                        outputResult = await processResult(await fs.readJson(outputFile), gi);
                    } catch (e) {
                        const message = `Failed to read output from Docker container '${main.name}': ${e.message}`;
                        progressLog.write(message);
                        failures.push(message);
                    }
                }

                const sidecars = spawnedContainers.slice(1);
                try {
                    await dockerCleanup({
                        network,
                        spawnOpts,
                        containers: sidecars,
                    });
                } catch (e) {
                    failures.push(e.message);
                }

                if (failures.length === 0 && !!outputResult) {
                    return outputResult;
                } else {
                    return {
                        code: failures.length,
                        message: (failures.length > 0) ? failures.join("; ") : "Successfully completed container job",
                    };
                }
            });
    };
}

/**
 * Generate container specific Docker command-line options.
 *
 * @param container Goal container spec
 * @param registration Container goal registration object
 * @return Docker command-line entrypoint, env, p, and volume options
 */
export function containerDockerOptions(container: GoalContainer, registration: ContainerRegistration): string[] {
    const entryPoint: string[] = [];
    if (container.command && container.command.length > 0) {
        // Docker CLI entrypoint must be a binary...
        entryPoint.push(`--entrypoint=${container.command[0]}`);
        // ...so prepend any other command elements to args array
        if (container.args) {
            container.args.splice(0, 0, ...container.command.slice(1));
        } else {
            container.args = container.command.slice(1);
        }
    }
    const envs = (container.env || []).map(env => `--env=${env.name}=${env.value}`);
    const ports = (container.ports || []).map(port => `-p=${port.containerPort}`);
    const volumes: string[] = [];
    for (const vm of (container.volumeMounts || [])) {
        const volume = (registration.volumes || []).find(v => v.name === vm.name);
        if (!volume) {
            const msg = `Container '${container.name}' references volume '${vm.name}' which not provided in goal registration ` +
                `volumes: ${stringify(registration.volumes)}`;
            logger.error(msg);
            throw new Error(msg);
        }
        volumes.push(`--volume=${volume.hostPath.path}:${vm.mountPath}`);
    }
    return [
        ...entryPoint,
        ...envs,
        ...ports,
        ...volumes,
    ];
}

/**
 * Use a temporary under the home directory so Docker can use it as a
 * volume mount.
 */
export function dockerTmpDir(): string {
    return path.join(os.homedir(), ".atomist", "tmp");
}

/**
 * Docker elements to cleanup after execution.
 */
interface CleanupOptions {
    /**
     * Options to use when calling spawnLog.  Also provides the
     * progress log.
     */
    spawnOpts: SpawnLogOptions;
    /** Containers to kill by name, if provided. */
    containers?: SpawnedContainer[];
    /**
     * Name of Docker network created for this goal execution.  If
     * provided, it will be removed.
     */
    network?: string;
}

/**
 * Kill running Docker containers, then delete network, and
 * remove directory container directory.  If the copy fails, it throws
 * an error.  Other errors are logged and ignored.
 *
 * @param opts See [[CleanupOptions]]
 */
async function dockerCleanup(opts: CleanupOptions): Promise<void> {
    if (opts.containers) {
        await dockerKill(opts.containers, opts.spawnOpts);
    }
    if (opts.network) {
        const networkDeleteRes = await spawnLog("docker", ["network", "rm", opts.network], opts.spawnOpts);
        if (networkDeleteRes.code) {
            const msg = `Failed to delete Docker network '${opts.network}'` +
                ((networkDeleteRes.error) ? `: ${networkDeleteRes.error.message}` : "");
            opts.spawnOpts.log.write(msg);
        }
    }
}

/**
 * Kill Docker containers.  Any errors are caught and logged, but not
 * re-thrown.
 *
 * @param containers Containers to kill, they will be killed by name
 * @param opts Options to use when calling spawnLog
 */
async function dockerKill(containers: SpawnedContainer[], opts: SpawnLogOptions): Promise<void> {
    try {
        const killPromises: Array<Promise<SpawnLogResult>> = [];
        for (const container of containers) {
            killPromises.push(spawnLog("docker", ["kill", container.name], opts));
        }
        await Promise.all(killPromises);
    } catch (e) {
        const message = `Failed to kill Docker containers: ${e.message}`;
        opts.log.write(message);
    }
}
