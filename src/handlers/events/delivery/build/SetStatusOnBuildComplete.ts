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

import {GraphQL, HandlerResult, logger, Secret, Secrets, Success} from "@atomist/automation-client";
import {EventFired, EventHandler, HandleEvent, HandlerContext} from "@atomist/automation-client/Handlers";
import {GitHubRepoRef} from "@atomist/automation-client/operations/common/GitHubRepoRef";
import {ProjectOperationCredentials, TokenCredentials} from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import {RemoteRepoRef} from "@atomist/automation-client/operations/common/RepoId";
import * as slack from "@atomist/slack-messages/SlackMessages";
import axios from "axios";
import * as stringify from "json-stringify-safe";
import {AddressChannels, addressChannelsFor} from "../../../../";
import { PlannedPhase } from "../../../../common/phases/Phases";
import {LogInterpretation} from "../../../../spi/log/InterpretedLog";
import {BuildStatus, OnBuildComplete} from "../../../../typings/types";
import {createStatus, State} from "../../../../util/github/ghub";
import {reportFailureInterpretation} from "../../../../util/slack/reportFailureInterpretation";
import {NotARealUrl} from "./local/LocalBuilder";

/**
 * Set build status on complete build
 */
@EventHandler("Set status on build complete",
    GraphQL.subscriptionFromFile("graphql/subscription/OnBuildComplete.graphql"))
export class SetStatusOnBuildComplete implements HandleEvent<OnBuildComplete.Subscription> {

    @Secret(Secrets.OrgToken)
    private githubToken: string;

    constructor(private buildPhase: PlannedPhase,
                private logInterpretation?: LogInterpretation) {
    }

    public async handle(event: EventFired<OnBuildComplete.Subscription>, ctx: HandlerContext, params: this): Promise<HandlerResult> {
        const build = event.data.Build[0];
        const commit = build.commit;

        const id = new GitHubRepoRef(commit.repo.owner, commit.repo.name, commit.sha);
        const builtStatus = commit.statuses.find(s => s.context === params.buildPhase.context);
        const ghStatusState = buildStatusToGitHubStatusState(build.status);
        if (!!builtStatus) {
            await setBuiltContext(params.buildPhase,
                ghStatusState,
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

export async function displayBuildLogFailure(id: RemoteRepoRef, build: { buildUrl?: string, status?: string} ,
                                             ac: AddressChannels, logInterpretation?: LogInterpretation) {
    const buildUrl = build.buildUrl;
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

async function setBuiltContext(phase: PlannedPhase, state: State, url: string, id: GitHubRepoRef, creds: ProjectOperationCredentials): Promise<any> {
    const description = state === "pending" ? phase.workingDescription : phase.completedDescription;
    return createStatus((creds as TokenCredentials).token, id, {
        state,
        target_url: (url === NotARealUrl ? undefined : url),
        context: phase.context,
        description,
    });
}
