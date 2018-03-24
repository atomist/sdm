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

import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { ArtifactStore } from "../../../../../spi/artifact/ArtifactStore";
import { AppInfo } from "../../../../../spi/deploy/Deployment";
import { LogInterpreter } from "../../../../../spi/log/InterpretedLog";
import { LogFactory } from "../../../../../spi/log/ProgressLog";
import { asSpawnCommand, SpawnCommand, } from "../../../../../util/misc/spawned";
import { ProjectLoader } from "../../../../repo/ProjectLoader";
import { SpawnBuilder } from "../SpawnBuilder";
import { Project } from "@atomist/automation-client/project/Project";

export const Install: SpawnCommand = asSpawnCommand("npm install");

export const RunBuild: SpawnCommand = asSpawnCommand("npm run build");

export const RunCompile: SpawnCommand = asSpawnCommand("npm run compile");

/**
 * Build with npm in the local automation client.
 * Note it is NOT intended for use for multiple organizations. It's OK
 * for one organization to use inside its firewall, but there is potential
 * vulnerability in builds of unrelated tenants getting at each others
 * artifacts.
 */
export class NpmBuilder extends SpawnBuilder {

    constructor(artifactStore: ArtifactStore,
                logFactory: LogFactory,
                projectLoader: ProjectLoader,
                buildCommand1: SpawnCommand = RunBuild,
                ...additionalCommands: SpawnCommand[]) {
        super("NpmBuilder", artifactStore, logFactory, projectLoader,
            (code, signal, l) => {
                return l.log.startsWith("[error]") || l.log.includes("ERR!");
            },
            [Install, buildCommand1].concat(additionalCommands));
    }

    protected async projectToAppInfo(p: Project): Promise<AppInfo> {
        const packageJson = await p.findFile("package.json");
        const content = await packageJson.getContent();
        const pkg = JSON.parse(content);
        return {id: p.id as RemoteRepoRef, name: pkg.name, version: pkg.version};
    }

    public logInterpreter: LogInterpreter = log => {
        const relevantPart = log.split("\n")
            .filter(l => l.startsWith("ERROR") || l.includes("ERR!"))
            .join("\n");
        return {
            relevantPart,
            message: "npm errors",
            includeFullLog: true,
        };
    }

}
