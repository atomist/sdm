import {
    HandleCommand,
    HandlerContext,
    MappedParameter,
    MappedParameters,
    Parameter,
    Secret,
    Secrets,
} from "@atomist/automation-client";
import { Parameters } from "@atomist/automation-client/decorators";
import { commandHandlerFrom } from "@atomist/automation-client/onCommand";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { addressSlackChannels, buttonForCommand } from "@atomist/automation-client/spi/message/MessageClient";
import { Maker } from "@atomist/automation-client/util/constructionUtils";
import * as slack from "@atomist/slack-messages/SlackMessages";
import { tipOfDefaultBranch } from "../../../handlers/commands/editors/toclient/ghub";
import { runningAttachment } from "../../../handlers/commands/reportRunning";
import { ProductionMauve } from "../../../handlers/events/delivery/phases/productionDeployPhases";
import {
    OnVerifiedStatus,
    VerifiedDeploymentInvocation
} from "../../../handlers/events/delivery/verify/OnVerifiedStatus";
import { TokenCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";

/**
 * Display a button suggesting promotion to production
 * @type {OnVerifiedStatus}
 */
export const OfferPromotion = () => new OnVerifiedStatus([presentPromotionButton]);

async function presentPromotionButton(inv: VerifiedDeploymentInvocation) {
    const shaLink = slack.url(inv.id.url + "/tree/" + inv.id.sha, inv.id.repo);
    const endpointLink = slack.url(inv.status.targetUrl);
    const messageId = `httpService:promote:prod/${inv.id.repo}/${inv.id.owner}/${inv.id.sha}`;
    const currentlyRunning = await runningAttachment(inv.context,
        (inv.credentials as TokenCredentials).token,
        inv.id,
        {domain: "ri-production", color: ProductionMauve}, inv.id.sha);

    const attachment: slack.Attachment = {
        color: ProductionMauve,
        text: `Staging endpoint verified at ${endpointLink}\nPromote ${shaLink} to production?`,
        fallback: "offer to promote",
        actions: [buttonForCommand({text: "Promote to Prod"},
            "DeployToProd",
            {
                repo: inv.id.repo, owner: inv.id.owner, sha: inv.id.sha,
                messageId,
                destinationsJson: JSON.stringify(inv.messageDestination),
            })],
    };
    const message: slack.SlackMessage = {
        attachments: currentlyRunning.concat([attachment]),
    };
    return inv.context.messageClient.send(message, inv.messageDestination, {id: messageId});
}

@Parameters()
export class OfferPromotionParameters {
    @Secret(Secrets.UserToken)
    public githubToken;

    @MappedParameter(MappedParameters.GitHubOwner)
    public owner;

    @MappedParameter(MappedParameters.GitHubRepository)
    public repo;

    @Parameter({required: false})
    public sha;

    @MappedParameter(MappedParameters.SlackChannel)
    public channel;
}

export const offerPromotionCommand: Maker<HandleCommand<OfferPromotionParameters>> = () =>
    commandHandlerFrom(async (context: HandlerContext, params: OfferPromotionParameters) => {
            const inv: VerifiedDeploymentInvocation = {
                id: new GitHubRepoRef(params.owner, params.repo, params.sha || await
                    tipOfDefaultBranch(params.githubToken, new GitHubRepoRef(params.owner, params.repo))),
                status: {targetUrl: undefined},
                credentials: {token: params.githubToken},
                messageDestination: addressSlackChannels(params.channel),
                context,
            };
            return presentPromotionButton(inv);
        }, OfferPromotionParameters, "OfferPromotionButton", "test: suggest promoting a ref to prod",
        "please offer to promote");
