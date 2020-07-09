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

import { GitProject } from "@atomist/automation-client/lib/project/git/GitProject";
import { Project } from "@atomist/automation-client/lib/project/Project";
import * as df from "dateformat";
import { LogSuppressor } from "../../../../api-helper/log/logInterpreters";
import { spawnLog } from "../../../../api-helper/misc/child_process";
import { ExecuteGoalResult } from "../../../../api/goal/ExecuteGoalResult";
import {
    GoalInvocation,
    GoalProjectListenerEvent,
    GoalProjectListenerRegistration,
    PrepareForGoalExecution,
} from "../../../../api/goal/GoalInvocation";
import { SdmGoalEvent } from "../../../../api/goal/SdmGoalEvent";
import { ProjectVersioner, readSdmVersion } from "../../../../core/delivery/build/local/projectVersioner";
import { ProgressLog } from "../../../../spi/log/ProgressLog";
import { determineMavenCommand } from "../mavenCommand";
import { MavenProgressReporter } from "../MavenProgressReporter";
import { MavenProjectIdentifier } from "../parse/pomParser";
import { IsMaven } from "../pushTests";

export const MavenOptions = [
    "-B",
    "-Dorg.slf4j.simpleLogger.log.org.apache.maven.cli.transfer.Slf4jMavenTransferListener=warn",
];

async function newVersion(sdmGoal: SdmGoalEvent, p: Project): Promise<string> {
    const pi = await MavenProjectIdentifier(p);
    const branch = sdmGoal.branch.split("/").join(".");
    return `${pi.version}-${branch}.${df(new Date(), "yyyymmddHHMMss")}`;
}

/**
 * ProjectVersioner to be used with Maven projects
 * @param sdmGoal
 * @param p
 * @param log
 * @constructor
 */
export const MavenProjectVersioner: ProjectVersioner = async (sdmGoal, p, log) => {
    const version = await newVersion(sdmGoal, p);
    await changeMavenVersion(version, p, log);
    return version;
};

/**
 * PrepareForGoalExecution for updating the Maven version in project
 * @param p
 * @param goalInvocation
 * @constructor
 */
export const MavenVersionPreparation: PrepareForGoalExecution = async (
    p: GitProject,
    goalInvocation: GoalInvocation,
) => {
    const version = await newVersion(goalInvocation.goalEvent, p);
    return changeMavenVersion(version, p, goalInvocation.progressLog);
};

async function changeMavenVersion(
    version: string,
    p: GitProject,
    progressLog: ProgressLog,
): Promise<ExecuteGoalResult> {
    const command = await determineMavenCommand(p);
    const args = [
        "build-helper:parse-version",
        "versions:set",
        `-DnewVersion=${version}`,
        "versions:commit",
        ...MavenOptions,
    ];
    return spawnLog(command, args, { cwd: p.baseDir, log: progressLog });
}

export async function mavenIncrementPatchVersionCommand(
    p: GitProject,
    progressLog: ProgressLog,
): Promise<ExecuteGoalResult> {
    const command = await determineMavenCommand(p);
    const args = [
        "build-helper:parse-version",
        "versions:set",
        // tslint:disable-next-line:no-invalid-template-strings
        "${parsedVersion.majorVersion}.${parsedVersion.minorVersion}.${parsedVersion.nextIncrementalVersion}-${parsedVersion.qualifier}",
        "versions:commit",
        ...MavenOptions,
    ];
    return spawnLog(command, args, { cwd: p.baseDir, log: progressLog });
}

export async function mvnVersionProjectListener(
    p: GitProject,
    gi: GoalInvocation,
    event: GoalProjectListenerEvent,
): Promise<void | ExecuteGoalResult> {
    const command = await determineMavenCommand(p);
    if (event === GoalProjectListenerEvent.before) {
        const v = await readSdmVersion(
            gi.goalEvent.repo.owner,
            gi.goalEvent.repo.name,
            gi.goalEvent.repo.providerId,
            gi.goalEvent.sha,
            gi.goalEvent.branch,
            gi.context,
        );
        return spawnLog(command, ["versions:set", `-DnewVersion=${v}`, "versions:commit", ...MavenOptions], {
            cwd: p.baseDir,
            log: gi.progressLog,
        });
    }
}

export const MvnVersion: GoalProjectListenerRegistration = {
    name: "mvn-version",
    listener: mvnVersionProjectListener,
    pushTest: IsMaven,
};

async function mvnPackageProjectListener(
    p: GitProject,
    gi: GoalInvocation,
    event: GoalProjectListenerEvent,
): Promise<void | ExecuteGoalResult> {
    const command = await determineMavenCommand(p);
    if (event === GoalProjectListenerEvent.before) {
        return spawnLog(command, ["package", ...MavenOptions, "-DskipTests=true", `-Dartifact.name=${p.id.repo}`], {
            cwd: p.baseDir,
            log: gi.progressLog,
        });
    }
}

export const MvnPackage: GoalProjectListenerRegistration = {
    name: "mvn-package",
    listener: mvnPackageProjectListener,
    pushTest: IsMaven,
};

export const MavenDefaultOptions = {
    pushTest: IsMaven,
    logInterpreter: LogSuppressor,
    progressReporter: MavenProgressReporter,
};
