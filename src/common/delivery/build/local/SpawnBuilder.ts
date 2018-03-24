/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
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
import { ArtifactStore } from "../../../../spi/artifact/ArtifactStore";
import { AppInfo } from "../../../../spi/deploy/Deployment";
import { LogInterpretation, LogInterpreter } from "../../../../spi/log/InterpretedLog";
import { LogFactory, ProgressLog } from "../../../../spi/log/ProgressLog";
import {
    ChildProcessResult,
    ErrorFinder,
    spawnAndWatch,
    SpawnCommand,
    stringifySpawnCommand,
} from "../../../../util/misc/spawned";
import { ProjectLoader } from "../../../repo/ProjectLoader";
import { LocalBuilder, LocalBuildInProgress } from "./LocalBuilder";

/**
 * Build using spawn on the automation client node.
 * Note it is NOT intended for use for multiple organizations. It's OK
 * for one organization to use inside its firewall, but there is potential
 * vulnerability in builds of unrelated tenants getting at each others
 * artifacts.
 */
export abstract class SpawnBuilder extends LocalBuilder implements LogInterpretation {

    constructor(name: string,
                artifactStore: ArtifactStore,
                logFactory: LogFactory,
                projectLoader: ProjectLoader,
                private errorFinder: ErrorFinder,
                public buildCommands: SpawnCommand[]) {
        super(name, artifactStore, logFactory, projectLoader);
    }

    /**
     * Find artifact info
     * @param {Project} p
     * @return {Promise<AppInfo>}
     */
    protected abstract projectToAppInfo(p: Project): Promise<AppInfo>;

    /**
     * Find the deploymentUnit after a successful build
     * @param {Project} p
     * @param {AppInfo} appId
     * @return {Promise<string>}
     */
    protected deploymentUnitFor(p: GitProject, appId: AppInfo): Promise<string> {
        return undefined;
    }

    protected async startBuild(credentials: ProjectOperationCredentials,
                               id: RemoteRepoRef,
                               team: string,
                               log: ProgressLog): Promise<LocalBuildInProgress> {
        const errorFinder = this.errorFinder;
        logger.info("%s.startBuild on %s, buildCommands=[%j]", this.name, id.url, this.buildCommands);
        return this.projectLoader.doWithProject({credentials, id, readOnly: true}, async p => {
            const appId: AppInfo = await this.projectToAppInfo(p);
            const opts = {
                cwd: p.baseDir,
            };

            try {
                let buildResult: ChildProcessResult;
                for (const buildCommand of this.buildCommands) {
                    buildResult = await spawnAndWatch(buildCommand, opts, log,
                        {
                            errorFinder,
                            stripAnsi: true,
                        });
                    if (buildResult.error) {
                        logger.info("Stopping build commands due to error on %s", stringifySpawnCommand(buildCommand));
                        break;
                    }
                }
                const b = new SpawnedBuild(appId, id, buildResult, team, log.url, await this.deploymentUnitFor(p, appId));
                logger.info("Build RETURN: %j", b.buildResultAchieved);
                return b;
            } catch {
                const b = new SpawnedBuild(appId, id, ({error: true, code: 1}), team, log.url, undefined);
                logger.info("Build FAILURE: %j", b.buildResultAchieved);
                return b;
            }
        });
    }

    public abstract logInterpreter: LogInterpreter;

}

class SpawnedBuild implements LocalBuildInProgress {

    public readonly buildResult: Promise<ChildProcessResult>;

    constructor(public appInfo: AppInfo,
                public repoRef: RemoteRepoRef,
                public buildResultAchieved: ChildProcessResult,
                public team: string,
                public url: string,
                public deploymentUnitFile: string) {
        this.buildResult = Promise.resolve(buildResultAchieved);
    }

}
