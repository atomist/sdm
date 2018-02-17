import {
    HandleCommand,
    HandlerContext,
    MappedParameter,
    MappedParameters,
    Parameter,
    Secret,
    Secrets,
} from "@atomist/automation-client";
import { CommandHandler } from "@atomist/automation-client/decorators";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { Fingerprint } from "@atomist/automation-client/project/fingerprint/Fingerprint";
import { addressSlackUsers } from "@atomist/automation-client/spi/message/MessageClient";
import * as slack from "@atomist/slack-messages/SlackMessages";
import { sendFingerprint } from "../../../handlers/commands/editors/toclient/fingerprints";
import { listStatuses, Status } from "../../../handlers/commands/editors/toclient/ghub";
import { BuiltContext } from "../../../handlers/events/delivery/phases/httpServicePhases";
import { ProductionDeployPhases } from "../../../handlers/events/delivery/phases/productionDeployPhases";

@CommandHandler("Promote to production", "promote to production")
export class DeployToProd implements HandleCommand {

    @Secret(Secrets.userToken(["repo", "user:email", "read:user"]))
    private githubToken: string;

    @MappedParameter(MappedParameters.SlackUserName)
    private slackUserName: string;

    @Parameter()
    private owner: string;

    @Parameter()
    private repo: string;

    @Parameter()
    private sha: string;

    // update this message
    @Parameter({required: false})
    private messageId: string;

    // in these channels
    @Parameter({required: false})
    private destinationsJson: string;

    public async handle(ctx: HandlerContext, params: this): Promise<any> {

        const address = (message: slack.SlackMessage | string) => {
            const destination = params.destinationsJson ? JSON.parse(params.destinationsJson) :
                addressSlackUsers(ctx.teamId, params.slackUserName);
            const messageOptions = {id: params.messageId}; // undefined is ok
            return ctx.messageClient.send(message, destination, messageOptions);
        };

        await address(workingMessage(params));

        const id = new GitHubRepoRef(params.owner, params.repo, params.sha);
        const creds = {token: params.githubToken};
        await ProductionDeployPhases.setAllToPending(id, creds);

        const fingerprint: Fingerprint = {
            name: "DeployToProduction",
            version: "1.0",
            data: "do-it",
            sha: "12345",
            abbreviation: "dp",
        };

        await sendFingerprint(id, fingerprint, ctx.teamId);
        // if (result.code === 0) {
        //     await address(successMessage(params));
        // } else {
        //     await address(tryAgainMessage(params, result.message));
        // }

        return ctx.messageClient.respond("Deploying to production...");
    }
}

function successMessage(params: DeployToProd) {
    return "did it";
}

function workingMessage(params: DeployToProd) {
    return "working on it";
}

function tryAgainMessage(params: DeployToProd, message: string) {
    return "failed";
}

/**
 * Rewrite the artifact status so that we get a new event
 * @param {GitHubRepoRef} id
 * @param {string} token
 * @return {Promise<any>}
 */
function findArtifactStatus(id: GitHubRepoRef, token: string): Promise<Status> {
    return listStatuses(token, id)
        .then(statuses => {
            return statuses.find(s => s.context === BuiltContext);
        });
}
