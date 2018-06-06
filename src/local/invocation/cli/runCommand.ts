#! /usr/bin/env node

import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { execSync } from "child_process";
import * as fs from "fs";
import { addGitHooks } from "../../setup/addGitHooks";
import { sdm } from "../machine";

/* tslint:disable */

const args = process.argv.slice(2);

const command = args[0];

if (args[0] === undefined) {
    console.log("Usage: slalom [args]");
    process.exit(1);
}

switch (command) {
    case "install" :
        sdm.installGitHooks();
        break;

    case "import" :
        if (args.length !== 3) {
            console.log("Usage: slalom import [org] [repo]");
            process.exit(1);
        }
        const org = args[1];
        const repo = args[2];
        console.log(`Adding GitHub project ${org}/${repo}`);
        const orgDir = `${sdm.configuration.repositoryOwnerParentDirectory}/${org}`;
        fs.mkdirSync(orgDir);
        execSync(`git clone http://github.com/${org}/${repo}`,
            {cwd: orgDir});
        addGitHooks(new GitHubRepoRef(org, repo), `${orgDir}/${repo}`);
        break;

    default:
        console.log(`Unknown command [${command}]`);
}