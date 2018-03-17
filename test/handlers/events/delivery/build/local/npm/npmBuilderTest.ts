import "mocha";

import * as assert from "power-assert";

import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { LocalBuildInProgress } from "../../../../../../../src/common/delivery/build/local/LocalBuilder";
import {
    NpmBuilder,
    RunBuild,
    RunCompile,
} from "../../../../../../../src/common/delivery/build/local/npm/NpmBuilder";
import { ConsoleProgressLog } from "../../../../../../../src/common/log/progressLogs";
import { SpawnCommand } from "../../../../../../../src/util/misc/spawned";

class TestableNpmBuilder extends NpmBuilder {

    public runningBuild: LocalBuildInProgress;

    constructor(buildCommand: SpawnCommand, private handleResult: (success: boolean) => any) {
        super(undefined, async () => ConsoleProgressLog, buildCommand);
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
            async () => true, "T123", { branch: "master"});
    }).timeout(100000);

    it("should test", async () => {
        const b = new TestableNpmBuilder(RunBuild,
            success => assert(success, "Build should have succeeded"));
        await b.initiateBuild({token: process.env.GITHUB_TOKEN},
            new GitHubRepoRef("atomist", "github-sdm"),
            async () => true, "T123", { branch: "master"});
    }).timeout(100000);

});
