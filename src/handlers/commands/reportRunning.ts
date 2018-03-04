// how to figure out what is running in Prod

import {HandleCommand, HandlerContext, MappedParameter, MappedParameters, Parameter, Secret, Secrets} from "@atomist/automation-client";
import {Parameters} from "@atomist/automation-client/decorators";
import {commandHandlerFrom, OnCommand} from "@atomist/automation-client/onCommand";
import {GitHubRepoRef} from "@atomist/automation-client/operations/common/GitHubRepoRef";
import {RemoteRepoRef} from "@atomist/automation-client/operations/common/RepoId";
import * as slack from "@atomist/slack-messages/SlackMessages";
import * as _ from "lodash";
import * as graphqlTypes from "../../typings/types";
import {tipOfDefaultBranch} from "../../util/github/ghub";
import {linkToDiff, renderDiff} from "../../util/slack/diffRendering";

@Parameters()
export class ReportRunningParameters {

    @Secret(Secrets.UserToken)
    public githubToken: string;

    @MappedParameter(MappedParameters.GitHubOwner)
    public owner;

    @MappedParameter(MappedParameters.GitHubRepository)
    public repo;

    @Parameter({required: false})
    public comparisonSha: string;
}

export interface ServiceDomain {
    domain: string;
    color: string;
}

export function reportRunningCommand(serviceDomains: ServiceDomain[],
                                     intent: string = "what is running"): HandleCommand<ReportRunningParameters> {
    const handlerName = "ReportRunning-" + serviceDomains.map(sd => sd.domain).join("-");
    return commandHandlerFrom(reportRunningServices(serviceDomains), ReportRunningParameters, handlerName,
        "describe services Atomist thinks are running", intent);
}

function reportRunningServices(serviceDomains: ServiceDomain[]): OnCommand<ReportRunningParameters> {
    return async (ctx, params) => {
        const sha = params.comparisonSha || await
            tipOfDefaultBranch(params.githubToken, new GitHubRepoRef(params.owner, params.repo));

        const repoRef = new GitHubRepoRef(params.owner, params.repo, sha);

        return Promise.all(serviceDomains
            .map(sd => runningAttachment(ctx, params.githubToken, repoRef, sd,
                params.comparisonSha || "master")))
            .then(arraysOfAttachments => {
                const attachments = _.flatten(arraysOfAttachments);
                const message: slack.SlackMessage = {
                    attachments,
                };
                return ctx.messageClient.respond(message);
            });
    };
}

interface RunningCommit {
    sha?: string;
    repo?: {
        owner?: string,
        name?: string,
    };
}

interface CountBySha {
    [key: string]: number;
}

function whatIsRunning(owner: string, repo: string, everythingRunning: RunningCommit[]): CountBySha {
    const myCommits = everythingRunning
        .filter(c => !!c.repo)
        .filter(c => c.repo.owner === owner && c.repo.name === repo);
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

function describeCurrentlyRunning(id: RemoteRepoRef, countBySha: CountBySha, endDescription?: string): string {
    const shas = Object.keys(countBySha);
    if (shas.length === 0) {
        return "No running services recorded";
    }
    return shas.map(s => `${countBySha[s]} reported running at ${linkToSha(id, s)} ${
        s === id.sha ? (endDescription ? "(" + endDescription + ")" : "") : linkToDiff(id, s, id.sha, endDescription)}`).join("\n");
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

export async function runningAttachment(ctx: HandlerContext, token: string,
                                        id: GitHubRepoRef, serviceDomain: ServiceDomain,
                                        endDescription?: string): Promise<slack.Attachment[]> {
    const countBySha = whatIsRunning(id.owner, id.repo, await gatherEverythingRunning(ctx, serviceDomain.domain));
    const text = describeCurrentlyRunning(id, countBySha, endDescription);
    const attachment: slack.Attachment = {
        fallback: "currently running services",
        text,
        title: serviceDomain.domain,
        color: serviceDomain.color,
    };
    const onlySha = getOnlySha(countBySha);
    if (!onlySha) {
        return [attachment];
    }
    return [attachment].concat(await renderDiff(token, id, onlySha, id.sha, serviceDomain.color));
}

function getOnlySha(countBySha: CountBySha) {
    const shas = Object.keys(countBySha);
    if (shas.length !== 1) {
        return undefined;
    }
    // there is exactly 1
    return shas[0];
}
