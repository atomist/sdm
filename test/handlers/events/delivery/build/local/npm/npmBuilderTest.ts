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

/*class TestableNpmBuilder extends SpawnBuilder {

    public runningBuild: LocalBuildInProgress;

    constructor(buildCommand: SpawnCommand, private readonly handleResult: (success: boolean) => any) {
        super(undefined, async () => new ConsoleProgressLog(), CloningProjectLoader, npmBuilderOptions([Install, buildCommand]));
    }

    protected async onStarted(runningBuild: LocalBuildInProgress, branch: string): Promise<LocalBuildInProgress> {
        this.runningBuild = runningBuild;
        return runningBuild;
    }

    protected async onExit(token: string, success: boolean, rb: LocalBuildInProgress, atomistTeam: string, branch: string): Promise<any> {
        this.handleResult(success);
        return true;
    }
}*/

/* describe("NpmBuilder", () => {

    // Not necessary when we're dog fooding...just slows down the test suite
    it.skip("should compile", async () => {
        const b = new TestableNpmBuilder(RunCompile,
            success => assert(success, "Build should have succeeded"));
        await b.initiateBuild({token: process.env.GITHUB_TOKEN},
            new GitHubRepoRef("spring-team", "github-sdm"),
            async () => true,  {branch: "master"}, new ConsoleProgressLog(), {} as HandlerContext);
    }); // .timeout(300000);

    // This is slow and unnecessary, as dog fooding usage tests this
    it.skip("should test", async () => {
        const b = new TestableNpmBuilder(RunBuild,
            success => assert(success, "Build should have succeeded"));
        await b.initiateBuild({token: process.env.GITHUB_TOKEN},
            new GitHubRepoRef("spring-team", "github-sdm"),
            async () => true, {branch: "master"}, new ConsoleProgressLog(), {} as HandlerContext);
    }); // .timeout(300000);

});
*/
