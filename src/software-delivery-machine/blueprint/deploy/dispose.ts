import { CloudFoundryInfo, EnvironmentCloudFoundryTarget } from "../../../handlers/events/delivery/deploy/pcf/CloudFoundryTarget";
import { runCommand } from "@atomist/automation-client/action/cli/commandLine";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { ProjectOperationCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { logger } from "@atomist/automation-client";


async function disposeOfProject(creds: ProjectOperationCredentials, id: RemoteRepoRef) {
    const appNames = await determineAppName(creds, id);
    await Promise.all(appNames.map(async (appName) => {
        const cfi = new EnvironmentCloudFoundryTarget();
        await deletePCF(cfi, appName); // staging
        cfi.space = "ri-production";
        await deletePCF(cfi, appName);
    }));
}

async function determineAppName(creds: ProjectOperationCredentials, id: RemoteRepoRef): Promise<string[]> {
    const project = await GitCommandGitProject.cloned(creds, id);
    let manifest = "";
    try {
        manifest = await project.findFile("manifest.yml").then(f => f.getContent());
    } catch (err) {
        return [];
    }
// todo: officially parse yaml
    const nameMatch = manifest.match(/^- name: (.*)$/m);
    if (nameMatch) {
      return [nameMatch[1]];
    } else {
        throw new Error("Could not parse app name from manifest: " + manifest);
    }
}

async function deletePCF(cfi: CloudFoundryInfo, appName: string) {
    logger.info(`Deleting ${appName} from ${cfi.space}`);
    const loginResult = await runCommand(
        `cf login -a ${cfi.api} -o ${cfi.org} -u ${cfi.username} -p '${cfi.password}' -s ${cfi.space}`, {});
    console.log("Successfully selected space [%s]", cfi.space);

    const deleteResult = await runCommand(`cf delete ${appName} -r -f`, {});
    console.log(deleteResult.stdout);

}