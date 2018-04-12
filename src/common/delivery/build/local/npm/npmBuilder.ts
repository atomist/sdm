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
import { Project } from "@atomist/automation-client/project/Project";
import { AppInfo } from "../../../../../spi/deploy/Deployment";
import { asSpawnCommand, SpawnCommand } from "../../../../../util/misc/spawned";
import { createEphemeralProgressLogWithConsole } from "../../../../log/EphemeralProgressLog";
import { ProjectLoader } from "../../../../repo/ProjectLoader";
import { SpawnBuilder, SpawnBuilderOptions } from "../SpawnBuilder";
import { NpmLogInterpreter } from "./npmLogInterpreter";

// Options to use when running node commands like npm run compile that require dev dependencies to be installed
export const DevelopmentEnvOptions = {
    env: {
        ...process.env,
        NODE_ENV: "development",
    },
};

export const Install: SpawnCommand = asSpawnCommand("npm ci", DevelopmentEnvOptions);

export const RunBuild: SpawnCommand = asSpawnCommand("npm run build", DevelopmentEnvOptions);

export const RunCompile: SpawnCommand = asSpawnCommand("npm run compile", DevelopmentEnvOptions);

export function nodeRunBuildBuilder(projectLoader: ProjectLoader) {
    return new SpawnBuilder(undefined,
        createEphemeralProgressLogWithConsole,
        projectLoader, npmBuilderOptions([Install, RunBuild]));
}

export function nodeRunCompileBuilder(projectLoader: ProjectLoader) {
    return new SpawnBuilder(undefined,
        createEphemeralProgressLogWithConsole,
        projectLoader, npmBuilderOptions([Install, RunCompile]));
}

export function npmBuilderOptions(commands: SpawnCommand[]): SpawnBuilderOptions {
    return {
        name: "NpmBuilder",
        commands,
        errorFinder: (code, signal, l) => {
            return l.log.startsWith("[error]") || l.log.includes("ERR!");
        },
        logInterpreter: NpmLogInterpreter,
        async projectToAppInfo(p: Project): Promise<AppInfo> {
            const packageJson = await p.findFile("package.json");
            const content = await packageJson.getContent();
            const pkg = JSON.parse(content);
            return {id: p.id as RemoteRepoRef, name: pkg.name, version: pkg.version};
        },
    };
}

export function npmBuilderOptionsFromFile(commandFile: string): SpawnBuilderOptions {
    return {
        name: "NpmBuilder",
        commandFile,
        errorFinder: (code, signal, l) => {
            return l.log.startsWith("[error]") || l.log.includes("ERR!");
        },
        logInterpreter: NpmLogInterpreter,
        async projectToAppInfo(p: Project): Promise<AppInfo> {
            const packageJson = await p.findFile("package.json");
            const content = await packageJson.getContent();
            const pkg = JSON.parse(content);
            return {id: p.id as RemoteRepoRef, name: pkg.name, version: pkg.version};
        },
    };
}
