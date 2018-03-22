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

import "mocha";

import * as assert from "power-assert";

import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { GitProject } from "@atomist/automation-client/project/git/GitProject";
import { InMemoryProject } from "@atomist/automation-client/project/mem/InMemoryProject";
import { LocalBuildInProgress } from "../../../../../../../src/common/delivery/build/local/LocalBuilder";
import {
    NpmBuilder,
    RunBuild,
    RunCompile,
} from "../../../../../../../src/common/delivery/build/local/npm/NpmBuilder";
import { ConsoleProgressLog } from "../../../../../../../src/common/log/progressLogs";
import { ProjectLoader } from "../../../../../../../src/common/repo/ProjectLoader";
import { SpawnCommand } from "../../../../../../../src/util/misc/spawned";

const EmptyProjectLoader = {
    load() {
        return Promise.resolve(new InMemoryProject()) as any as Promise<GitProject>;
    },
} as any as ProjectLoader;

class TestableNpmBuilder extends NpmBuilder {

    public runningBuild: LocalBuildInProgress;

    constructor(buildCommand: SpawnCommand, private handleResult: (success: boolean) => any) {
        super(undefined, async () => ConsoleProgressLog, EmptyProjectLoader, buildCommand);
    }

    protected async onStarted(runningBuild: LocalBuildInProgress, branch: string): Promise<LocalBuildInProgress> {
        this.runningBuild = runningBuild;
        return runningBuild;
    }

    protected async onExit(token: string, success: boolean, rb: LocalBuildInProgress, atomistTeam: string, branch: string): Promise<any> {
        this.handleResult(success);
        return true;
    }
}

describe("NpmBuilder", () => {

    it("should compile", async () => {
        const b = new TestableNpmBuilder(RunCompile,
            success => assert(success, "Build should have succeeded"));
        await b.initiateBuild({token: process.env.GITHUB_TOKEN},
            new GitHubRepoRef("atomist", "github-sdm"),
            async () => true, "T123", {branch: "master"});
    }).timeout(100000);

    it("should test", async () => {
        const b = new TestableNpmBuilder(RunBuild,
            success => assert(success, "Build should have succeeded"));
        await b.initiateBuild({token: process.env.GITHUB_TOKEN},
            new GitHubRepoRef("atomist", "github-sdm"),
            async () => true, "T123", {branch: "master"});
    }).timeout(100000);

});
