import {
    HandleCommand, HandlerContext, HandlerResult, logger, MappedParameter, MappedParameters, Parameter, Secret, Secrets,
    success,
} from "@atomist/automation-client";
import { runCommand } from "@atomist/automation-client/action/cli/commandLine";
import { Parameters } from "@atomist/automation-client/decorators";
import { commandHandlerFrom } from "@atomist/automation-client/onCommand";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { ProjectOperationCredentials, TokenCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { GitCommandGitProject } from "@atomist/automation-client/project/git/GitCommandGitProject";
import { deleteRepository } from "../../../handlers/commands/editors/toclient/ghub";
import { CloudFoundryInfo, EnvironmentCloudFoundryTarget } from "../../../handlers/events/delivery/deploy/pcf/CloudFoundryTarget";

@Parameters()
export class DisposeParameters {

    @Secret(Secrets.userToken("delete_repo"))
    public githubToken: string;

    @MappedParameter(MappedParameters.GitHubOwner)
    public owner: string;

    @MappedParameter(MappedParameters.GitHubRepository)
    public repo: string;

    @MappedParameter(MappedParameters.SlackUserName)
    public screenName: string;

    @Parameter({displayName: "Are you sure?"})
    public areYouSure: string;

}

export const disposeProjectHandler: HandleCommand<DisposeParameters> =
    commandHandlerFrom(disposeHandle,
        DisposeParameters,
        "DisposeOfProject",
        "Delete deployments and repo",
        "dispose of this project");

function disposeHandle(ctx: HandlerContext, params: DisposeParameters): Promise<HandlerResult> {
    if (params.areYouSure.toLowerCase() !== "yes") {
        return ctx.messageClient.respond("You didn't say 'yes' to 'are you sure?' so I won't do anything.")
            .then(success);
    }
    const id = new GitHubRepoRef(params.owner, params.repo);
    const creds = {token: params.githubToken};
    return disposeOfProject(creds, id)
        .then(() => ctx.messageClient.respond("Repository deleted."))
        .then(success);
}

async function disposeOfProject(creds: ProjectOperationCredentials, id: RemoteRepoRef) {
    const appNames = await determineAppName(creds, id);
    await Promise.all(appNames.map(async appName => {
        const cfi = new EnvironmentCloudFoundryTarget();
        await deletePCF(cfi, appName); // staging
        cfi.space = "ri-production";
        await deletePCF(cfi, appName);
    }));
    await deleteRepository((creds as TokenCredentials).token, id as GitHubRepoRef);
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
    logger.info("Successfully selected space [%s]", cfi.space);

    const deleteResult = await runCommand(`cf delete ${appName} -r -f`, {});
    logger.info(deleteResult.stdout);
}
