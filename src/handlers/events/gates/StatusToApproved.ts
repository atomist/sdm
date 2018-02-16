
import { CommandHandler, HandleCommand, HandlerContext, Parameter, Secret, Secrets } from "@atomist/automation-client";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import * as assert from "power-assert";
import { createStatus, listStatuses } from "../../commands/editors/toclient/ghub";
import { ApprovalGateParam } from "./StatusApprovalGate";

@CommandHandler("Transition status to approve")
export class StatusToApproved implements HandleCommand {

    @Secret(Secrets.userToken(["repo", "user:email", "read:user"]))
    private githubToken: string;

    @Parameter()
    private context: string;

    @Parameter()
    private owner: string;

    @Parameter()
    private repo: string;

    @Parameter()
    private sha: string;

    // // update this message
    // @Parameter({required: false})
    // private messageId: string;
    //
    // // in these channels
    // @Parameter({required: false})
    // private destinationsJson: string;

    public async handle(ctx: HandlerContext, params: this): Promise<any> {

        const id = new GitHubRepoRef(params.owner, params.repo, params.sha);

        const statuses = await listStatuses(params.githubToken, id);
        const oldStatus = statuses.find(status => status.context === params.context);
        assert(!!oldStatus);

        await createStatus(params.githubToken, id, {
            context: oldStatus.context,
            state: oldStatus.state,
            description: oldStatus.description,
            target_url: oldStatus.target_url.replace(ApprovalGateParam, ""),
        });
        return ctx.messageClient.respond("Approved");
    }
}
