/*
 * Copyright © 2017 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
    GraphQL, HandleCommand, HandlerResult, logger, MappedParameter, MappedParameters, Parameter, Secret, Secrets,
    Success
} from "@atomist/automation-client";
import * as _ from "lodash";
import {EventFired, EventHandler, HandleEvent, HandlerContext} from "@atomist/automation-client/Handlers";
import {GitHubRepoRef} from "@atomist/automation-client/operations/common/GitHubRepoRef";
import {
    ProjectOperationCredentials,
    TokenCredentials,
} from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import {BuildStatus, BuildUrlBySha, OnBuildComplete} from "../../../../typings/types";
import {createStatus, State, tipOfDefaultBranch} from "../../../../util/github/ghub";
import {NotARealUrl} from "./local/LocalBuilder";
import {LogInterpretation} from "../../../../spi/log/InterpretedLog";
import axios from "axios";
import {reportFailureInterpretation} from "../../../../util/slack/reportFailureInterpretation";
import {AddressChannels, addressChannelsFor} from "../../../../";
import * as stringify from "json-stringify-safe";
import * as slack from "@atomist/slack-messages/SlackMessages";
import {RemoteRepoRef} from "@atomist/automation-client/operations/common/RepoId";
import {commandHandlerFrom} from "@atomist/automation-client/onCommand";
import {ApplyPhasesParameters, applyPhasesToCommit} from "../phase/SetupPhasesOnPush";
import {HttpServicePhases} from "../phases/httpServicePhases";
import {Parameters} from "@atomist/automation-client/decorators";

/**
 * Set build status on complete build
 */
@EventHandler("Check endpoint",
    GraphQL.subscriptionFromFile("graphql/subscription/OnBuildComplete.graphql"))
export class SetStatusOnBuildComplete implements HandleEvent<OnBuildComplete.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    constructor(private buildPhaseContext: string,
                private logInterpretation?: LogInterpretation) {
    }

    public async handle(event: EventFired<OnBuildComplete.Subscription>, ctx: HandlerContext, params: this): Promise<HandlerResult> {
        const build = event.data.Build[0];
        const commit = build.commit;

        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);
        const builtStatus = commit.statuses.find(s => s.context === params.buildPhaseContext);
        if (!!builtStatus) {
            await setBuiltContext(params.buildPhaseContext,
                buildStatusToGitHubStatusState(build.status),
                build.buildUrl,
                id,
                {token: params.githubToken});
        }
        if (build.status === "failed" && build.buildUrl) {
            const ac = addressChannelsFor(commit.repo, ctx);
            await displayBuildLogFailure(id, build, ac, params.logInterpretation);
        }
        return Success;
    }
}

@Parameters()
export class DisplayBuildLogParameters {
    @Secret(Secrets.UserToken)
    public githubToken: string;

    @MappedParameter(MappedParameters.GitHubOwner)
    public owner: string;

    @MappedParameter(MappedParameters.GitHubRepository)
    public repo: string;

    @Parameter({required: false})
    public sha?: string;
}


function displayBuildLogForCommit(interpreter?: LogInterpretation) {
    return async (ctx: HandlerContext,
                  params: { githubToken: string, owner: string, repo: string, sha?: string }) => {

        const sha = params.sha ? params.sha :
            await tipOfDefaultBranch(params.githubToken, new GitHubRepoRef(params.owner, params.repo));

        const id = new GitHubRepoRef(params.owner, params.repo, sha);

        const ac: AddressChannels = (msg, opts) => ctx.messageClient.respond(msg, opts);
        const build = await fetchBuildUrl(ctx, id);

        await displayBuildLogFailure(id, build, ac, interpreter);
        await ctx.messageClient.respond(":heavy_check_mark: Build log displayed for " + sha);
        return Success;
    }
}

async function fetchBuildUrl(context: HandlerContext, id: RemoteRepoRef): Promise<{ buildUrl?: string }> {
    const queryResult = await context.graphClient.executeQueryFromFile<BuildUrlBySha.Query, BuildUrlBySha.Variables>(
        "graphql/query/BuildUrlBySha", { sha: id.sha })
    const commit: BuildUrlBySha.Commit = _.get(queryResult, "Commit[0]");
    if (!commit) {
        throw new Error("No commit found for " + id.sha);
    }
    if (!commit.builds || commit.builds.length === 0) {
        throw new Error("No builds found for commit " + id.sha);
    }
    // TODO: sort by timestamp
    return queryResult.Commit[0].builds[0];
}

export function displayBuildLogHandler(logInterpretation?: LogInterpretation): HandleCommand<DisplayBuildLogParameters> {
    logger.info("Log interpreter provided? " + !!logInterpretation);
    return commandHandlerFrom(displayBuildLogForCommit(logInterpretation),
        DisplayBuildLogParameters, "DisplayBuildLog",
        "interpret and report on a build log",
        "show build log");
}

async function displayBuildLogFailure(id: RemoteRepoRef,build:{ buildUrl?: string, status?: string} ,
                                      ac: AddressChannels, logInterpretation?: LogInterpretation) {
    const buildUrl = build.buildUrl
    if (buildUrl) {
        logger.info("Retrieving failed build log from " + buildUrl);
        const buildLog = (await axios.get(buildUrl)).data;
        console.log("Do we have a log interpretation? " + !!logInterpretation);
        const interpretation = logInterpretation && logInterpretation.logInterpreter(buildLog);
        console.log("What did it say? " + stringify(interpretation));
        // The deployer might have information about the failure; report it in the channels
        if (interpretation) {
            await reportFailureInterpretation("build", interpretation,
                {log: buildLog, url: buildUrl}, id, ac);
        } else {
            await ac({
                content: buildLog,
                fileType: "text",
                fileName: `build-${build.status}-${id.sha}.log`,
            } as any);
        }
    } else {
        ac("No build log detected for " + linkToSha(id));
    }
}

function linkToSha(id: RemoteRepoRef) {
    return slack.url(id.url + "/tree/" + id.sha, id.sha.substr(0, 6));
}

function buildStatusToGitHubStatusState(buildStatus: BuildStatus): State {
    switch (buildStatus) {
        case "passed" :
            return "success";
        case "broken":
        case "failed":
        case "canceled" :
            return "failure";
        default:
            return "pending";
    }
}

async function setBuiltContext(context: string, state: State, url: string, id: GitHubRepoRef, creds: ProjectOperationCredentials): Promise<any> {
    return createStatus((creds as TokenCredentials).token, id, {
        state,
        target_url: (url === NotARealUrl ? undefined : url),
        context,
        description: `Completed ${context}`,
    });
}
