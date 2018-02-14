import { HandleCommand, HandlerContext, Parameter, Secret, Secrets } from "@atomist/automation-client";
import { CommandHandler } from "@atomist/automation-client/decorators";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { ProductionDeployPhases } from "../../handlers/events/delivery/phases/productionDeployPhases";
import { listStatuses, Status } from "../../handlers/commands/editors/toclient/ghub";
import { ArtifactContext } from "../../handlers/events/delivery/Phases";
import { deploy } from "../../handlers/events/delivery/DeployFromLocalOnArtifactStatus";
import { artifactStore } from "./artifactStore";
import { EnvironmentCloudFoundryTarget } from "../../handlers/events/delivery/deploy/pcf/CloudFoundryTarget";
import { Deployer } from "./cloudFoundryDeployOnArtifactStatus";

@CommandHandler("Promote to production", "promote to production")
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
            .then(() => findArtifactStatus(id, params.githubToken))
            .then(artifactStatus => {
                return deploy(ProductionDeployPhases.phases[0],
                    ProductionDeployPhases.phases[1],
                    id, params.githubToken, artifactStatus.target_url,
                    artifactStore, Deployer,
                    ProductionCloudFoundryTargeter)
            });
    }

}

const ProductionCloudFoundryTargeter = () => ({
    ...new EnvironmentCloudFoundryTarget(),
    space: "ri-production",
});

/**
 * Rewrite the artifact status so that we get a new event
 * @param {GitHubRepoRef} id
 * @param {string} token
 * @return {Promise<any>}
 */
function findArtifactStatus(id: GitHubRepoRef, token: string): Promise<Status> {
    return listStatuses(token, id)
        .then(statuses => {
            return statuses.find(s => s.context === ArtifactContext);
        });
}
