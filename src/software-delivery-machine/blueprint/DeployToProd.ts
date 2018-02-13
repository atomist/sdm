import { HandleCommand, HandlerContext, Parameter, Secret, Secrets, Success } from "@atomist/automation-client";
import { CommandHandler } from "@atomist/automation-client/decorators";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { ProductionDeployPhases } from "../../handlers/events/delivery/phases/productionDeployPhases";

@CommandHandler("Promote to production")
export class DeployToProd implements HandleCommand {

    @Secret(Secrets.userToken(["repo", "user:email", "read:user"]))
    private githubToken: string;

    @Parameter()
    private owner: string;

    @Parameter()
    private repo: string;

    public handle(ctx: HandlerContext, params: this): Promise<any> {

        const id = new GitHubRepoRef(params.owner, params.repo);

        const creds = {token: params.githubToken};
        return ProductionDeployPhases.setAllToPending(id, creds)
            .then(() => Success);
    }

}
