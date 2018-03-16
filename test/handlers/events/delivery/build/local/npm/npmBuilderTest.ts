import "mocha";

import * as assert from "power-assert";

import { NpmBuilder } from "../../../../../../../src/handlers/events/delivery/build/local/npm/NpmBuilder";
import { createEphemeralProgressLog } from "../../../../../../../src/common/log/EphemeralProgressLog";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { LocalBuildInProgress } from "../../../../../../../src/handlers/events/delivery/build/local/LocalBuilder";

class TestableNpmBuilder extends NpmBuilder {

    public runningBuild: LocalBuildInProgress;

    constructor(buildCommand: string, private handleResult: (success: boolean) => any) {
        super(undefined, createEphemeralProgressLog, buildCommand);
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
        const b = new TestableNpmBuilder("npm run compile",
            success => assert(success, "Build should have succeeded"));
        await b.initiateBuild({token: process.env.GITHUB_TOKEN},
            new GitHubRepoRef("atomist", "github-sdm"),
            async () => true, "T123", { branch: "master"});
    }).timeout(100000);

});
