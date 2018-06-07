import { logger } from "@atomist/automation-client";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { execSync } from "child_process";
import * as fs from "fs";
import { Argv } from "yargs";
import { LocalSoftwareDeliveryMachine } from "../../../machine/LocalSoftwareDeliveryMachine";
import { addGitHooks } from "../../../setup/addGitHooks";
import { logExceptionsToConsole } from "../support/consoleOutput";

export function addImportFromGitHubCommand(sdm: LocalSoftwareDeliveryMachine, yargs: Argv) {
    yargs.command({
        command: "import",
        describe: "Import from GitHub: slalom import --owner=x --repo=y",
        builder: {
            owner: {
                required: true,
            },
            repo: {
                required: true,
            },
        },
        handler: argv => {
            return logExceptionsToConsole(() => importFromGitHub(sdm, argv.owner, argv.repo));
        },
    });
}

async function importFromGitHub(sdm: LocalSoftwareDeliveryMachine, org: string, repo: string): Promise<any> {
    logger.info(`Adding GitHub project ${org}/${repo}`);
    const orgDir = `${sdm.configuration.repositoryOwnerParentDirectory}/${org}`;
    if (!fs.existsSync(orgDir)) {
        fs.mkdirSync(orgDir);
    }
    execSync(`git clone http://github.com/${org}/${repo}`,
        {cwd: orgDir});
    return addGitHooks(new GitHubRepoRef(org, repo), `${orgDir}/${repo}`);
}
