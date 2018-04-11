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
import { LogInterpreter } from "../../../../../spi/log/InterpretedLog";
import { asSpawnCommand, SpawnCommand } from "../../../../../util/misc/spawned";
import { createEphemeralProgressLogWithConsole } from "../../../../log/EphemeralProgressLog";
import { ProjectLoader } from "../../../../repo/ProjectLoader";
import { SpawnBuilder, SpawnBuilderOptions } from "../SpawnBuilder";

export const RunBuild: SpawnCommand = asSpawnCommand("lein");

export function leinBuilder(projectLoader: ProjectLoader) {
    return new SpawnBuilder(undefined,
        createEphemeralProgressLogWithConsole,
        projectLoader, leinBuilderOptions([RunBuild]));
}

export const leinLogInterpreter: LogInterpreter = log => {
    const relevantPart = log.split("\n")
        .filter(l => l.startsWith("ERROR") || l.includes("ERR!"))
        .join("\n");
    return {
        relevantPart,
        message: "npm errors",
        includeFullLog: true,
    };
};

export function leinBuilderOptions(commands: SpawnCommand[]): SpawnBuilderOptions {
    return {
        name: "LeinBuilder",
        commands,
        errorFinder: (code, signal, l) => {
            return l.log.startsWith("[error]") || l.log.includes("ERR!");
        },
        logInterpreter: leinLogInterpreter,
        async projectToAppInfo(p: Project): Promise<AppInfo> {
            // const packageJson = await p.findFile("package.json");
            // const content = await packageJson.getContent();
            // const pkg = JSON.parse(content);
            const name = "name";
            const version = "version";
            return {id: p.id as RemoteRepoRef, name, version};
        },
        options: {
            env: {
                ...process.env,
                NODE_ENV: "development",
            },
        },
    };
}
