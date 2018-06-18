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

import { logger } from "@atomist/automation-client";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { Project } from "@atomist/automation-client/project/Project";
import { SpawnOptions } from "child_process";
import * as _ from "lodash";
import { sprintf } from "sprintf-js";
import {
    asSpawnCommand,
    ChildProcessResult,
    ErrorFinder,
    spawnAndWatch,
    SpawnCommand,
    stringifySpawnCommand,
} from "../../../../api-helper/misc/spawned";
import { ArtifactStore } from "../../../../spi/artifact/ArtifactStore";
import { AppInfo } from "../../../../spi/deploy/Deployment";
import { InterpretLog, LogInterpretation } from "../../../../spi/log/InterpretedLog";
import { ProgressLog } from "../../../../spi/log/ProgressLog";
import { ProjectLoader } from "../../../../spi/project/ProjectLoader";
import { LocalBuilder, LocalBuildInProgress } from "./LocalBuilder";

export interface SpawnBuilderOptions {

    name: string;

    /**
     * Commands we'll execute via Node spawn.
     * Command execution will terminate on the first error.
     */
    commands?: SpawnCommand[];

    /**
     * Alternative to commands. File containing a list of
     * newline-separated commands. May contain blank lines
     * or comments beginning with #.
     */
    commandFile?: string;

    /**
     * Error finder: Necessary only if a spawned process
     * can return non-zero on success.
     */
    errorFinder?: ErrorFinder;

    /**
     * Interpreter of command output
     */
    logInterpreter: InterpretLog;

    options?: SpawnOptions;

    /**
     * If this method is implemented, it enriches the options returned by the options
     * property with data from within the given project
     * @param {GitProject} p
     * @param {module:child_process.SpawnOptions} options
     * @return {Promise<module:child_process.SpawnOptions>}
     */
    enrich?(options: SpawnOptions, p: GitProject): Promise<SpawnOptions>;

    /**
     * Find artifact info from the sources of this project,
     * for example by parsing a package.json or Maven POM file.
     * @param {Project} p
     * @return {Promise<AppInfo>}
     */
    projectToAppInfo(p: Project): Promise<AppInfo>;

    /**
     * Find the deploymentUnit after a successful build
     * @param {Project} p
     * @param {AppInfo} appId
     * @return {Promise<string>}
     */
    deploymentUnitFor?(p: GitProject, appId: AppInfo): Promise<string>;

}

/**
 * Build using spawn on the automation client node.
 * Note it is NOT intended for use for multiple organizations. It's OK
 * for one organization to use inside its firewall, but there is potential
 * vulnerability in builds of unrelated tenants getting at each others
 * artifacts.
 */
export class SpawnBuilder extends LocalBuilder implements LogInterpretation {

    private readonly options: SpawnBuilderOptions;

    constructor(params: {
        artifactStore?: ArtifactStore,
        projectLoader: ProjectLoader,
        options: SpawnBuilderOptions,
    }) {
        super(params.options.name, params.artifactStore, params.projectLoader);
        this.options = params.options;
        if (!this.options.commands && !this.options.commandFile) {
            throw new Error("Please supply either commands or a path to a file in the project containing them");
        }
    }

    public get logInterpreter(): InterpretLog {
        return this.options.logInterpreter;
    }

    protected async startBuild(credentials: ProjectOperationCredentials,
                               id: RemoteRepoRef,
                               team: string,
                               log: ProgressLog): Promise<LocalBuildInProgress> {
        const errorFinder = this.options.errorFinder;
        logger.info("%s.startBuild on %s, buildCommands=[%j] or file=[%s]", this.name, id.url, this.options.commands,
            this.options.commandFile);
        return this.projectLoader.doWithProject({credentials, id, readOnly: true}, async p => {

            const commands: SpawnCommand[] = this.options.commands || await loadCommandsFromFile(p, this.options.commandFile);

            const appId: AppInfo = await this.options.projectToAppInfo(p);

            let optionsToUse = this.options.options || {};
            if (!!this.options.enrich) {
                logger.info("Enriching options from project %s:%s", p.id.owner, p.id.repo);
                optionsToUse = await this.options.enrich(optionsToUse, p);
            }
            const opts = _.merge({cwd: p.baseDir}, optionsToUse);

            function executeOne(buildCommand: SpawnCommand): Promise<ChildProcessResult> {
                return spawnAndWatch(buildCommand,
                    _.merge(opts, buildCommand.options),
                    log,
                    {
                        errorFinder,
                        stripAnsi: true,
                    })
                    .then(br => {
                        if (br.error) {
                            const message = "Stopping build commands due to error on " + stringifySpawnCommand(buildCommand);
                            log.write(message);
                            return {error: true, code: br.code, message};
                        }
                        return br;
                    });
            }

            let buildResult: Promise<ChildProcessResult> = executeOne(commands[0]);
            for (const buildCommand of commands.slice(1)) {
                buildResult = buildResult
                    .then(br => {
                        if (br.error) {
                            throw new Error("Build failure: " + br.error);
                        }
                        log.write(sprintf("Next after %j is...%s", br, stringifySpawnCommand(buildCommand)));
                        return executeOne(buildCommand);
                    });
            }
            buildResult = buildResult.then(br => {
                logger.info("Build RETURN: %j", br);
                return br;
            });
            const b = new SpawnedBuild(appId, id, buildResult, team, log.url,
                !!this.options.deploymentUnitFor ? await this.options.deploymentUnitFor(p, appId) : undefined);
            return b;
        });
    }

}

async function loadCommandsFromFile(p: Project, path: string) {
    const buildFile = await p.getFile(path);
    if (!buildFile) {
        return undefined;
    }
    const content = await buildFile.getContent();
    const commands = content.split("\n")
        .filter(l => !!l)
        .filter(l => !l.startsWith("#"))
        .map(l => asSpawnCommand(l, {}));
    logger.info("Found Atomist build file in project %j: Commands are %j", p.id,
        commands);

    return commands;
}

class SpawnedBuild implements LocalBuildInProgress {

    constructor(public appInfo: AppInfo,
                public repoRef: RemoteRepoRef,
                public buildResult: Promise<ChildProcessResult>,
                public team: string,
                public url: string,
                public deploymentUnitFile: string) {
    }

}
