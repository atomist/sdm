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

import { Project } from "@atomist/automation-client/project/Project";
import { Microgrammar } from "@atomist/microgrammar/Microgrammar";
import { asSpawnCommand, SpawnCommand } from "../../../../../api-helper/misc/spawned";
import { AppInfo } from "../../../../../spi/deploy/Deployment";
import { InterpretLog } from "../../../../../spi/log/InterpretedLog";
import { ProjectLoader } from "../../../../../spi/project/ProjectLoader";
import { SpawnBuilder, SpawnBuilderOptions } from "../SpawnBuilder";

export const RunBuild: SpawnCommand = asSpawnCommand("lein");

export function leinBuilder(projectLoader: ProjectLoader, ...commands: string[]) {
    return new SpawnBuilder({
        projectLoader, options: leinBuilderOptions(
            commands.map(l => asSpawnCommand(l, {}))),
    });
}

export const leinLogInterpreter: InterpretLog = log => {
    return {
        // We don't yet know how to interpret clojure logs
        relevantPart: undefined,
        message: "lein errors",
    };
};

export function leinBuilderOptions(commands: SpawnCommand[]): SpawnBuilderOptions {
    return {
        name: "LeinBuilder",
        commands,
        errorFinder: (code, signal, l) => {
            return code !== 0;
        },
        logInterpreter: leinLogInterpreter,
        projectToAppInfo: projectCljToAppInfo,
        options: {
            env: {
                ...process.env,
            },
        },
    };
}

export async function projectCljToAppInfo(p: Project): Promise<AppInfo> {
    const projectClj = await p.findFile("project.clj");
    const content = await projectClj.getContent();
    return appInfoGrammar.firstMatch(content);
}

const appInfoGrammar = Microgrammar.fromString<AppInfo>(
    "(defproject ${pkg}/${name} \"${version}\"", {
        name: /[\w-\-]+/,
    });
