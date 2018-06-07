#! /usr/bin/env node

import * as yargs from "yargs";
import { sdm } from "../machine";
import { addGitHooksCommand } from "./command/addGitHooksCommand";
import { addEditCommand } from "./command/editCommand";
import { addGenerateCommand } from "./command/generateCommand";
import { addImportFromGitHubCommand } from "./command/importFromGitHubCommand";
import { addRunCommand } from "./command/runCommand";
import { redirectLoggingToConsole } from "./support/redirectLoggingToConsole";

/* tslint:disable */

redirectLoggingToConsole();

yargs.usage("Usage: $0 <command> [options]");

addGenerateCommand(sdm, yargs);
addEditCommand(sdm, yargs);
addRunCommand(sdm, yargs);
addGitHooksCommand(yargs);
addImportFromGitHubCommand(sdm, yargs);

yargs
    .epilog("Copyright Atomist 2018")
    .argv;
