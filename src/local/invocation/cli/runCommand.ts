#! /usr/bin/env node

import { Arg } from "@atomist/automation-client/internal/transport/RequestProcessor";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { execSync } from "child_process";
import * as fs from "fs";
import { addGitHooks } from "../../setup/addGitHooks";
import { sdm } from "../machine";
import { logExceptionsToConsole } from "./logExceptionsToConsole";

/* tslint:disable */

require("yargs")
    .command({
        command: "add-git-hooks",
        desc: "Install web hooks",
        handler: () => {
            logExceptionsToConsole(() => sdm.installGitHooks());
        }
    })
    .command({
        command: "import",
        desc: "Import from GitHub: slalom import --owner=x --repo=y",
        builder: {
            owner: {
                required: true,
            },
            repo: {
                required: true,
            },
        },
        handler: argv => {
            logExceptionsToConsole(() => importFromGitHub(argv.owner, argv.repo));
        }
    })
    .command({
        command: "generate",
        aliases: ["g"],
        builder: {
            generator: {
                required: true,
            },
            owner: {
                required: true,
            },
            repo: {
                required: true,
            },
        },
        desc: "Generate",
        handler: argv => {
            console.log(JSON.stringify(argv));

            const extraArgs = Object.getOwnPropertyNames(argv)
                .map(name => ({name, value: argv[name]}));
            logExceptionsToConsole(() => generate(argv.generator, argv.owner, argv.repo, extraArgs));
        }
    })
    .command({
        command: "edit",
        aliases: ["e"],
        builder: {
            editor: {
                required: true,
            },
            owner: {
                required: true,
            },
            repos: {
                required: true,
            },
        },
        desc: "Edit",
        handler: argv => {
            console.log(JSON.stringify(argv));
            const extraArgs = Object.getOwnPropertyNames(argv)
                .map(name => ({name, value: argv[name]}));
            logExceptionsToConsole(() => edit(argv.editor, argv.owner, argv.repos, extraArgs));
        }
    })
    .command({
        command: "run",
        aliases: ["r"],
        builder: {
            command: {
                required: true,
            },
        },
        desc: "Run command",
        handler: argv => {
            console.log(JSON.stringify(argv));
            const command = Object.getOwnPropertyNames(argv)
                .map(name => ({name, value: argv[name]}));
            logExceptionsToConsole(() => runCommand(argv.command, command));
        }
    })
    .usage("Usage: $0 <command> [options]")
    .epilog("Copyright Atomist 2018")
    .argv;

async function importFromGitHub(org: string, repo: string): Promise<any> {
    console.log(`Adding GitHub project ${org}/${repo}`);
    const orgDir = `${sdm.configuration.repositoryOwnerParentDirectory}/${org}`;
    if (!fs.existsSync(orgDir)) {
        fs.mkdirSync(orgDir);
    }
    execSync(`git clone http://github.com/${org}/${repo}`,
        {cwd: orgDir});
    return addGitHooks(new GitHubRepoRef(org, repo), `${orgDir}/${repo}`);
}

async function generate(commandName: string, targetOwner: string, targetRepo: string,
                        extraArgs: Arg[]): Promise<any> {
    const hm = sdm.commandMetadata(commandName);
    if (!hm) {
        console.log(`No generator with name [${commandName}]: Known commands are [${sdm.commandsMetadata.map(m => m.name)}]`);
        process.exit(1);
    }
    const args = [
        {name: "target.owner", value: targetOwner},
        {name: "target.repo", value: targetRepo},
    ].concat(extraArgs);

    // TODO should come from environment
    args.push({name: "github://user_token?scopes=repo,user:email,read:user", value: null});
    return sdm.executeCommand(commandName, args);
}

async function edit(commandName: string, targetOwner: string, targetRepos: string,
                    extraArgs: Arg[]): Promise<any> {
    const hm = sdm.commandMetadata(commandName);
    if (!hm) {
        console.log(`No editor with name [${commandName}]: Known commands are [${sdm.commandsMetadata.map(m => m.name)}]`);
        process.exit(1);
    }
    const args = [
        {name: "targets.owner", value: targetOwner},
        {name: "target.repos", value: targetRepos},
    ].concat(extraArgs);

    // TODO should come from environment
    args.push({name: "github://user_token?scopes=repo,user:email,read:user", value: null});
    return sdm.executeCommand(commandName, args);
}

async function runCommand(commandName: string, args: Arg[]): Promise<any> {
    const hm = sdm.commandMetadata(commandName);
    if (!hm) {
        console.log(`No command with name [${commandName}]: Known commands are [${sdm.commandsMetadata.map(m => m.name)}]`);
        process.exit(1);
    }

    // TODO should come from environment
    args.push({name: "github://user_token?scopes=repo,user:email,read:user", value: null});
    return sdm.executeCommand(commandName, args);
}
