import {
    HandleCommand,
    HandleEvent,
    HandlerContext,
    MappedParameter,
    MappedParameters,
    Parameter,
} from "@atomist/automation-client";
import { Parameters } from "@atomist/automation-client/decorators";
import { commandHandlerFrom } from "@atomist/automation-client/onCommand";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { addressSlackChannels, buttonForCommand } from "@atomist/automation-client/spi/message/MessageClient";
import * as slack from "@atomist/slack-messages/SlackMessages";
import * as _ from "lodash";
import { OnVerifiedStatus, StatusInfo } from "../../handlers/events/delivery/OnVerifiedStatus";
import * as graphqlTypes from "../../typings/types";

/**
 * Display a button suggesting promotion to production
 * @type {OnVerifiedStatus}
 */
export const OfferPromotion: HandleEvent<any> = new OnVerifiedStatus(presentPromotionButton);

function presentPromotionButton(id: RemoteRepoRef, s: StatusInfo, sendMessagesHere, ctx) {
    const shaLink = slack.url(id.url + "/tree/" + id.sha, id.repo);
    const endpointLink = slack.url(s.targetUrl);
    const messageId = `httpService:promote:prod/${id.repo}/${id.owner}/${id.sha}`;
    const attachment: slack.Attachment = {
        text: `Staging endpoint verified at ${endpointLink}\nPromote ${shaLink} to production?`,
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

export const offerPromotionCommand: HandleCommand<OfferPromotionParameters> =
    commandHandlerFrom((ctx: HandlerContext, params: OfferPromotionParameters) => {
            return presentPromotionButton(new GitHubRepoRef(params.owner, params.repo, params.sha),
                undefined, addressSlackChannels(params.channel), ctx);
        }, OfferPromotionParameters, "OfferPromotionButton", "test: suggest promoting a ref to prod",
        "please offer to promote");

// how to figure out what is running in Prod

interface RunningCommit {
    sha?: string;
    repo?: {
        owner?: string,
        name?: string,
    };
}

interface CountBySha { [key: string]: number; }

function whatIsRunning(owner: string, repo: string, everythingRunning: RunningCommit[]): CountBySha {
    const myCommits = everythingRunning.filter(c => c.repo.owner === owner && c.repo.name === repo);
    return countBy(c => c.sha, myCommits);
}

function countBy<T>(f: (T) => string, data: T[]): { [key: string]: number } {
    const result = {};
    data.forEach(c => {
        const key = f(c);
        result[key] = (result[key] || 0) + 1;
    });
    return result;
}

function describeCurrentlyRunning(id: RemoteRepoRef, everythingRunning: RunningCommit[]): string {
    const countBySha = whatIsRunning(id.owner, id.repo, everythingRunning);
    const shas = Object.keys(countBySha);
    if (shas.length === 0) {
        return "No running services recorded";
    }
    if (shas.length > 1 || !id.sha) {
        return shas.map(s => `${countBySha[s]} reported running at ${linkToSha(id, s)}`).join("\n");
    }
    // there is exactly 1
    const oneSha = shas[0];
    return `${countBySha[oneSha]} reported running at ${oneSha.substr(0, 6)} ${linkToDiff(id, oneSha, id.sha)}`;
}

function linkToDiff(id: RemoteRepoRef, start: string, end: string) {
    return slack.url(`${id.url}/compare/${start}...${end}`, "(diff)");
}

function linkToSha(id: RemoteRepoRef, sha: string) {
    return slack.url(id.url + "/tree/" + sha, sha.substr(0, 6));
}

async function gatherEverythingRunning(ctx: HandlerContext, domain: string): Promise<graphqlTypes.WhatIsRunning.Commits[]> {
    const result = await ctx.graphClient.executeQueryFromFile<graphqlTypes.WhatIsRunning.Query, { domain: string }>(
        "graphql/query/WhatIsRunning", {domain});
    const runningCommits = _.flatMap(result.Application, app => app.commits);
    return runningCommits;
}

@Parameters()
export class ReportRunningParameters {
    @MappedParameter(MappedParameters.GitHubOwner)
    public owner;

    @MappedParameter(MappedParameters.GitHubRepository)
    public repo;
}

async function runningAttachment(ctx: HandlerContext, id: RemoteRepoRef, domain: string) {
    const text = describeCurrentlyRunning(id, await gatherEverythingRunning(ctx, domain));
    const attachment: slack.Attachment = {
        fallback: "stuff is running",
        text,
        title: domain,
    };
    return attachment;
}

export const reportRunning: HandleCommand<ReportRunningParameters> = commandHandlerFrom((ctx, params) => {
    const repoRef = new GitHubRepoRef(params.owner, params.repo);

    return Promise.all(["ri-staging", "ri-production"].map(d => runningAttachment(ctx, repoRef, d)))
        .then(attachments => {
            const message: slack.SlackMessage = {
                attachments,
            };
            return ctx.messageClient.respond(message);
        });
}, ReportRunningParameters, "ReportRunning", "describe services Atomist thinks are running", "what is running");
