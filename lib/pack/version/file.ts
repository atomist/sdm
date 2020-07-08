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

import { Project } from "@atomist/automation-client/lib/project/Project";
import * as semver from "semver";
import { LogSuppressor } from "../../api-helper/log/logInterpreters";
import { DefaultGoalNameGenerator } from "../../api/goal/GoalNameGenerator";
import { PushTest } from "../../api/mapping/PushTest";
import { ProjectVersioner } from "../../core/delivery/build/local/projectVersioner";
import { ProjectVersionerRegistration } from "../../core/goal/common/Version";
import { ProgressLog } from "../../spi/log/ProgressLog";
import { IncrementVersionRegistration, VersionIncrementer } from "./increment";
import { addBranchPreRelease } from "./semver";

/**
 * Version projects based on the value in a file, the path to which is
 * governed by [[versionFilePath]].
 */
export const FileVersioner: ProjectVersioner = async (goalEvent, project, log) => {
    const baseVersion = await readVersionFile(project, log);
    log.write(`Using base version '${baseVersion}'`);
    const prereleaseVersion = addBranchPreRelease(baseVersion, goalEvent);
    log.write(`Calculated pre-release version '${prereleaseVersion}'`);
    return prereleaseVersion;
};

/**
 * Push test indicating if project has either a `.version` or
 * `VERSION` file at the root of the repository.
 */
export const HasVersionFile: PushTest = {
    name: "HasVersionFile",
    mapping: async inv => (await inv.project.hasFile(".version")) || inv.project.hasFile("VERSION"),
};

/**
 * Versioner function registration for the [[Version]] goal.
 */
export const FileVersionerRegistration: ProjectVersionerRegistration = {
    logInterpreter: LogSuppressor,
    name: DefaultGoalNameGenerator.generateName("file-versioner"),
    pushTest: HasVersionFile,
    versioner: FileVersioner,
};

/**
 * Return path to version file in project.  Paths interrogated are
 * `.version` and `VERSION`.  The former takes precedence if neither
 * or both exist.
 *
 * @param p Projecto look for version file in
 */
export async function versionFilePath(p: Project): Promise<string> {
    for (const vp of [".version", "VERSION"]) {
        if (await p.hasFile(vp)) {
            return vp;
        }
    }
    return ".version";
}

/**
 * Read version from version file in project.  Version file can be
 * `.version` or `VERSION`, with the former taking precedence if both
 * exist.  If neither exist, "0.0.0" is returned.
 *
 * @param p Project to read version file in
 * @param log Progress log to write information to
 * @return Version as string
 */
export async function readVersionFile(p: Project, log: ProgressLog): Promise<string> {
    const versionPath = await versionFilePath(p);
    const versionFile = await p.getFile(versionPath);
    let version: string;
    if (versionFile) {
        const versionContents = await versionFile.getContent();
        version = versionContents.trim();
    } else {
        version = "0.0.0";
        log.write(`Project ${p.name} has no version file, using '${version}'`);
    }
    return version;
}

/**
 * Write provided version to version file in project.  The path to the
 * version file is determined using [[versionFilePath]].
 *
 * @param p Project to write version file to
 * @param log Progress log to write information to
 * @param v Version to write to version file
 */
export async function writeVersionFile(p: Project, log: ProgressLog, v: string): Promise<void> {
    const versionPath = await versionFilePath(p);
    const versionFile = await p.getFile(versionPath);
    const versionContent = `${v}\n`;
    if (versionFile) {
        await versionFile.setContent(versionContent);
    } else {
        log.write(`Project ${p.name} has no version file, creating '${versionPath}'`);
        await p.addFile(versionPath, versionContent);
    }
}

/**
 * Command for incrementing the patch value in version file.
 *
 * @param args Standard project incrementer arguments
 * @return Goal execution result
 */
export const FileVersionIncrementer: VersionIncrementer = async args => {
    const slug = `${args.id.owner}/${args.id.repo}`;
    try {
        const currentVersion = await readVersionFile(args.project, args.log);
        if (semver.gt(currentVersion, args.currentVersion)) {
            const msg =
                `Version in ${slug} appears to have already been incremented, expected '${args.currentVersion}' ` +
                `but found '${currentVersion}'`;
            args.log.write(msg);
            return { code: 1, message: msg };
        }
        const newVersion = semver.inc(args.currentVersion, args.increment);
        if (!newVersion || newVersion === currentVersion) {
            const msg = `Failed to increment ${args.increment} version '${currentVersion}' in ${slug}`;
            args.log.write(msg);
            return { code: 1, message: msg };
        }
        await writeVersionFile(args.project, args.log, newVersion);
        const message = `Incremented ${args.increment} version in ${slug}: ${args.currentVersion} => ${newVersion}`;
        args.log.write(message);
        return { code: 0, message };
    } catch (e) {
        const message = `Failed to increment ${args.increment} version in ${slug}: ${e.message}`;
        args.log.write(message);
        return { code: 1, message };
    }
};

/**
 * Increment version registration for [[FileVersionIncrementer]].
 */
export const FileVersionIncrementerRegistration: IncrementVersionRegistration = {
    logInterpreter: LogSuppressor,
    name: DefaultGoalNameGenerator.generateName("file-version-incrementer"),
    pushTest: HasVersionFile,
    versionIncrementer: FileVersionIncrementer,
};
