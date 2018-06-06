#! /usr/bin/env node

import * as yargs from "yargs";
import { sdm } from "../machine";
import { addGitHooksCommand } from "./addGitHooksCommand";
import { addEditCommand } from "./editCommand";
import { addGenerateCommand } from "./generateCommand";
import { addImportFromGitHubCommand } from "./importFromGitHubCommand";
import { redirectLoggingToConsole } from "./redirectLoggingToConsole";
import { addRunCommand } from "./runCommand";

/* tslint:disable */

redirectLoggingToConsole();

addGenerateCommand(sdm, yargs);
addEditCommand(sdm, yargs);
addRunCommand(sdm, yargs);
addGitHooksCommand(yargs);
addImportFromGitHubCommand(sdm, yargs);

yargs
    .usage("Usage: $0 <command> [options]")
    .epilog("Copyright Atomist 2018")
    .argv;
