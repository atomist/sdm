import {HandleCommand, HandleEvent, HandlerContext, MappedParameter, MappedParameters, Parameter} from "@atomist/automation-client";
import {addressSlackChannels, buttonForCommand} from "@atomist/automation-client/spi/message/MessageClient";
import * as slack from "@atomist/slack-messages/SlackMessages";
import {OnVerifiedStatus} from "../../handlers/events/delivery/OnVerifiedStatus";
import {commandHandlerFrom} from "@atomist/automation-client/onCommand";
import {Parameters} from "@atomist/automation-client/decorators";
import {GitHubRepoRef} from "@atomist/automation-client/operations/common/GitHubRepoRef";

/**
 * Display a button suggesting promotion to production
 * @type {OnVerifiedStatus}
 */
export const OfferPromotion: HandleEvent<any> = new OnVerifiedStatus(presentPromotionButton);

function presentPromotionButton(id, s, sendMessagesHere, ctx) {
    const messageId = "httpService:promote:prod/${id.repo}/${id.owner}/${id.sha}";
    const attachment: slack.Attachment = {
        text: "Endpoint has been verified. Promote this build to production?",
        fallback: "offer to promote",
        actions: [buttonForCommand({text: "Promote to Prod"},
            "DeployToProd",
            {
                repo: id.repo, owner: id.owner, sha: id.sha,
                messageId,
                destinationsJson: JSON.stringify(sendMessagesHere),
            })],
    };
    const message: slack.SlackMessage = {
        attachments: [attachment],
    };
    return ctx.messageClient.send(message, sendMessagesHere, {id: messageId});
}

@Parameters()
export class OfferPromotionParameters {
    @MappedParameter(MappedParameters.GitHubOwner)
    public owner;

    @MappedParameter(MappedParameters.GitHubRepository)
    public repo;

    @Parameter()
    public sha;

    @MappedParameter(MappedParameters.SlackChannel)
    public channel;
}

export const offerPromotionCommand: HandleCommand<OfferPromotionParameters> = commandHandlerFrom((ctx: HandlerContext, params: OfferPromotionParameters) => {
        return presentPromotionButton(new GitHubRepoRef(params.owner, params.repo, params.sha),
            undefined, addressSlackChannels(params.channel), ctx)
    }, OfferPromotionParameters, "OfferPromotionButton", "test: suggest promoting a ref to prod",
    "please offer to promote");
