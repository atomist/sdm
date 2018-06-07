#! /usr/bin/env node

import { setCommandLineLogging } from "./support/consoleOutput";

setCommandLineLogging();

import * as yargs from "yargs";
import { sdm } from "../machine";
import { addGitHooksCommand } from "./command/addGitHooksCommand";
import { addEditCommand } from "./command/editCommand";
import { addGenerateCommand } from "./command/generateCommand";
import { addImportFromGitHubCommand } from "./command/importFromGitHubCommand";
import { addRunCommand } from "./command/runCommand";

/* tslint:disable */

yargs.usage("Usage: $0 <command> [options]");

addGitHooksCommand(yargs);
addGenerateCommand(sdm, yargs);
addEditCommand(sdm, yargs);
addRunCommand(sdm, yargs);
addImportFromGitHubCommand(sdm, yargs);

yargs
    .epilog("Copyright Atomist 2018")
    .argv;
