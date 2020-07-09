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
import { LogSuppressor } from "../../../api-helper/log/logInterpreters";
import { spawnLog } from "../../../api-helper/misc/child_process";
import { formatDate } from "../../../api-helper/misc/dateFormat";
import { projectConfigurationValue } from "../../../api-helper/project/configuration/projectConfiguration";
import { DefaultGoalNameGenerator } from "../../../api/goal/GoalNameGenerator";
import { ProjectVersioner } from "../../../core/delivery/build/local/projectVersioner";
import { ProjectVersionerRegistration } from "../../../core/goal/common/Version";
import { ProgressLog } from "../../../spi/log/ProgressLog";
import { IncrementVersionRegistration, VersionIncrementer } from "../../version/increment";
import { NodeConfiguration } from "../nodeSupport";
import { IsNode } from "../pushtest/nodePushTests";
import { gitBranchToNpmVersion } from "./executePublish";

const packageJson = "package.json";

/**
 * Create timestamped pre-prelease, branch-aware version based on
 * version in package.json file.
 */
export const NpmVersioner: ProjectVersioner = async (sdmGoal, p, log) => {
    const version = await readPackageVersion(p, log);
    log.write(`Using base version '${version}'`);
    const branch = sdmGoal.branch.split("/").join(".");

    const tagMaster = await projectConfigurationValue<NodeConfiguration["npm"]["publish"]["tag"]["defaultBranch"]>(
        "npm.publish.tag.defaultBranch",
        p,
        false,
    );

    let branchSuffix = "";
    if (tagMaster) {
        branchSuffix = `${branch}.`;
    } else {
        branchSuffix = branch !== sdmGoal.push.repo.defaultBranch ? `${branch}.` : "";
    }

    const prereleaseVersion = `${version}-${gitBranchToNpmVersion(branchSuffix)}${formatDate()}`;
    log.write(`Calculated pre-release version '${prereleaseVersion}'`);
    return prereleaseVersion;
};

/**
 * Versioner function registration for the [[Version]] goal.
 */
export const NpmVersionerRegistration: ProjectVersionerRegistration = {
    logInterpreter: LogSuppressor,
    name: DefaultGoalNameGenerator.generateName("npm-versioner"),
    pushTest: IsNode,
    versioner: NpmVersioner,
};

/** @deprecated use NpmVersioner */
export const NodeProjectVersioner = NpmVersioner;

/**
 * Command for incrementing the patch value in package.json.
 *
 * @param args Standard project incrementer arguments
 * @return Goal execution result
 */
export const NpmVersionIncrementer: VersionIncrementer = async args => {
    const slug = `${args.id.owner}/${args.id.repo}`;
    try {
        const currentVersion = await readPackageVersion(args.project, args.log);
        if (semver.gt(currentVersion, args.currentVersion)) {
            const msg =
                `Version in ${slug} appears to have already been incremented, expected '${args.currentVersion}' ` +
                `but found '${currentVersion}'`;
            args.log.write(msg);
            return { code: 1, message: msg };
        } else if (currentVersion === defaultVersion) {
            if (!(await args.project.hasFile(packageJson))) {
                try {
                    await args.project.addFile(packageJson, `{"name":"@${slug}","version":"${args.currentVersion}"}\n`);
                } catch (e) {
                    const msg = `The ${packageJson} file did not exist in ${slug} and failed to create one: ${e.message}`;
                    args.log.write(msg);
                    return { code: 1, message: msg };
                }
            }
        }
        const newVersion = semver.inc(args.currentVersion, args.increment);
        const incrementResult = await spawnLog("npm", ["version", "--no-git-tag-version", newVersion], {
            cwd: args.project.baseDir,
            log: args.log,
        });
        if (incrementResult.code !== 0) {
            throw incrementResult.error;
        }
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
 * Increment version registration for [[NpmVersionIncrementer]].
 */
export const NpmVersionIncrementerRegistration: IncrementVersionRegistration = {
    logInterpreter: LogSuppressor,
    name: DefaultGoalNameGenerator.generateName("npm-version-incrementer"),
    pushTest: IsNode,
    versionIncrementer: NpmVersionIncrementer,
};

const defaultVersion = "0.0.0";

/**
 * Read version from package.json in project p.  If it fails to
 * determine the version from the package.json, it returns "0.0.0".
 */
export async function readPackageVersion(p: Project, log: ProgressLog): Promise<string> {
    let pjVersion: string;
    try {
        const pjFile = await p.getFile(packageJson);
        if (pjFile) {
            const pj: { version: string } = JSON.parse(await pjFile.getContent());
            pjVersion = pj.version;
        }
    } catch (e) {
        log.write(`Error reading version from package.json: ${e.message}`);
    }
    if (!pjVersion) {
        pjVersion = defaultVersion;
        log.write(`Failed to read version from package.json, using '${pjVersion}'`);
    }
    return pjVersion;
}
