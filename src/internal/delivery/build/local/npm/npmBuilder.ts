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

import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { Project } from "@atomist/automation-client/project/Project";
import { branchFromCommit } from "../../../../../api-helper/goal/executeBuild";
import {
    asSpawnCommand,
    spawnAndWatch,
    SpawnCommand,
} from "../../../../../api-helper/misc/spawned";
import { ExecuteGoalResult } from "../../../../../api/goal/ExecuteGoalResult";
import { RunWithLogContext } from "../../../../../api/goal/ExecuteGoalWithLog";
import { AppInfo } from "../../../../../spi/deploy/Deployment";
import { ProjectLoader } from "../../../../../spi/project/ProjectLoader";
import { readSdmVersion } from "../projectVersioner";
import { SpawnBuilder, SpawnBuilderOptions } from "../SpawnBuilder";
import { NpmLogInterpreter } from "./npmLogInterpreter";

/**
 * Options to use when running node commands like npm run compile that require dev dependencies to be installed
 */
export const DevelopmentEnvOptions = {
    env: {
        ...process.env,
        NODE_ENV: "development",
    },
};

export const Install: SpawnCommand = asSpawnCommand("npm ci", DevelopmentEnvOptions);

export function nodeBuilder(projectLoader: ProjectLoader, ...commands: string[]) {
    return new SpawnBuilder({
        projectLoader,
        options: npmBuilderOptions(commands.map(cmd => asSpawnCommand(cmd, DevelopmentEnvOptions))),
    });
}

function npmBuilderOptions(commands: SpawnCommand[]): SpawnBuilderOptions {
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
            return { id: p.id as RemoteRepoRef, name: pkg.name, version: pkg.version };
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
            return { id: p.id as RemoteRepoRef, name: pkg.name, version: pkg.version };
        },
    };
}

export const NpmPreparations = [npmInstallPreparation, npmVersionPreparation, npmCompilePreparation];

export async function npmInstallPreparation(p: GitProject, rwlc: RunWithLogContext): Promise<ExecuteGoalResult> {
    const hasPackageLock = p.fileExistsSync("package-lock.json");
    return spawnAndWatch({
        command: "npm",
        args: [hasPackageLock ? "ci" : "install"],
    }, {
            cwd: p.baseDir,
            ...DevelopmentEnvOptions,
        }, rwlc.progressLog,
        {
            errorFinder: code => code != null,
        });
}

export async function npmVersionPreparation(p: GitProject, rwlc: RunWithLogContext): Promise<ExecuteGoalResult> {
    const commit = rwlc.status.commit;
    const version = await readSdmVersion(
        commit.repo.owner,
        commit.repo.name,
        commit.repo.org.provider.providerId,
        commit.sha,
        branchFromCommit(commit),
        rwlc.context);
    return spawnAndWatch({
            command: "npm",
            args: ["--no-git-tag-version", "version", version],
        },
        {
            cwd: p.baseDir,
        },
        rwlc.progressLog,
        {
            errorFinder: code => code !== 0,
        });
}

export async function npmCompilePreparation(p: GitProject, rwlc: RunWithLogContext): Promise<ExecuteGoalResult> {
    return spawnAndWatch({
        command: "npm",
        args: ["run", "compile"],
    }, {
            cwd: p.baseDir,
            ...DevelopmentEnvOptions,
        }, rwlc.progressLog,
        {
            errorFinder: code => code != null,
        });
}
