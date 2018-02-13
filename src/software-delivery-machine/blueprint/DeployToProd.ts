import { HandleCommand, HandlerContext, Parameter, Secret, Secrets, Success } from "@atomist/automation-client";
import { CommandHandler } from "@atomist/automation-client/decorators";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { ProductionDeployPhases } from "../../handlers/events/delivery/phases/productionDeployPhases";
import { createStatus, listStatuses } from "../../handlers/commands/editors/toclient/ghub";
import { ArtifactContext } from "../../handlers/events/delivery/Phases";

@CommandHandler("Promote to production")
export class DeployToProd implements HandleCommand {

    @Secret(Secrets.userToken(["repo", "user:email", "read:user"]))
    private githubToken: string;

    @Parameter()
    private owner: string;

    @Parameter()
    private repo: string;

    @Parameter()
    private sha: string;

    public handle(ctx: HandlerContext, params: this): Promise<any> {
        const id = new GitHubRepoRef(params.owner, params.repo, params.sha);
        const creds = {token: params.githubToken};
        return ProductionDeployPhases.setAllToPending(id, creds)
            .then(() => renewArtifactStatus(id, creds.token))
            .then(() => Success);
    }

}

/**
 * Rewrite the artifact status so that we get a new event
 * @param {GitHubRepoRef} id
 * @param {string} token
 * @return {Promise<any>}
 */
function renewArtifactStatus(id: GitHubRepoRef, token: string): Promise<any> {
    return listStatuses(token, id)
        .then(statuses => {
            const artifactStatus = statuses.find(s => s.context === ArtifactContext);
            if (!!artifactStatus) {
                return createStatus(token, id, artifactStatus) as Promise<any>;
            }
            console.log("Unable to find artifact status");
            return Promise.resolve();
        });
}
