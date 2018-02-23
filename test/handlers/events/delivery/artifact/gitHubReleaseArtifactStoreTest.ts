import "mocha";

import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import * as fs from "fs";
import * as assert from "power-assert";
import {
    GitHubReleaseArtifactStore,
} from "../../../../../src/handlers/events/delivery/artifact/github/GitHubReleaseArtifactStore";

import { runCommand } from "@atomist/automation-client/action/cli/commandLine";
import * as p from "path";

const asset = "https://github.com/spring-team/fintan/releases/download/0.1.0-SNAPSHOT454/fintan-0.1.0-SNAPSHOT.jar";

describe("GitHubReleaseArtifactStore", () => {

    describe("checkout", () => {

        it("should checkout existing file", done => {
            const ghras = new GitHubReleaseArtifactStore();
            const id = new GitHubRepoRef("spring-team", "fintan");
            ghras.checkout(asset,
                id,
                {token: process.env.GITHUB_TOKEN})
                .then(da => {
                    console.log(JSON.stringify(da));
                    const path = `${da.cwd}/${da.filename}`;
                    assert(fs.existsSync(path), `File [${path}] must exist`);
                    const cwd = p.dirname(path);
                    const filename = p.basename(path);
                    runCommand(`unzip ${filename}`, { cwd })
                        .then(done());
                });
        }).timeout(15000);

        it("should checkout existing file and parse AppInfo", done => {
            const ghras = new GitHubReleaseArtifactStore();
            const id = new GitHubRepoRef("spring-team", "fintan");
            ghras.checkout(asset,
                id,
                {token: process.env.GITHUB_TOKEN})
                .then(da => {
                    console.log(JSON.stringify(da));
                    assert(da.id.owner === id.owner);
                    assert(da.id.repo === id.repo);
                    assert(da.name === "fintan", "name should be 'fintan', not " + da.name);
                    assert(da.version === "0.1.0-SNAPSHOT", "version should be '0.1.0-SNAPSHOT', not " + da.version);
                    done();
                });
        }).timeout(15000);
    });

});
