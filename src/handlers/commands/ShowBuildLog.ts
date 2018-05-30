/*
 * Copyright © 2018 Atomist, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { HandleCommand, MappedParameter, MappedParameters, Parameter, Secret, Secrets, Success } from "@atomist/automation-client";
import { Parameters } from "@atomist/automation-client/decorators";
import { HandlerContext } from "@atomist/automation-client/Handlers";
import { commandHandlerFrom } from "@atomist/automation-client/onCommand";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import * as _ from "lodash";
import { AddressChannels } from "../../api/context/addressChannels";
import { LogInterpretation } from "../../spi/log/InterpretedLog";
import { BuildUrlBySha } from "../../typings/types";
import { tipOfDefaultBranch } from "../../util/github/ghub";
import { DefaultRepoRefResolver } from "../common/DefaultRepoRefResolver";
import { displayBuildLogFailure } from "../events/delivery/build/SetStatusOnBuildComplete";

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
            await tipOfDefaultBranch(params.githubToken, new GitHubRepoRef(params.owner, params.repo)); // TODO: use fetchDefaultBranchTip

        // TODO get rid of hard coding
        const id = new DefaultRepoRefResolver().toRemoteRepoRef(params, {sha});
        const ac: AddressChannels = (msg, opts) => ctx.messageClient.respond(msg, opts);
        const build = await fetchBuildUrl(ctx, id);

        await displayBuildLogFailure(id, build, ac, interpreter);
        await ctx.messageClient.respond(":heavy_check_mark: Build log displayed for " + sha);
        return Success;
    };
}

async function fetchBuildUrl(context: HandlerContext, id: RemoteRepoRef): Promise<{ buildUrl?: string }> {
    const queryResult = await context.graphClient.query<BuildUrlBySha.Query, BuildUrlBySha.Variables>({
        name: "BuildUrlBySha",
        variables: {sha: id.sha},
    });
    const commit: BuildUrlBySha.Commit = _.get(queryResult, "Commit[0]");
    if (!commit) {
        throw new Error("No commit found for " + id.sha);
    }
    if (!commit.builds || commit.builds.length === 0) {
        throw new Error("No builds found for commit " + id.sha);
    }
    return queryResult.Commit[0].builds.sort((b1, b2) => b2.timestamp.localeCompare(b1.timestamp))[0];
}

export function displayBuildLogHandler(logInterpretation?: LogInterpretation): HandleCommand<DisplayBuildLogParameters> {
    return commandHandlerFrom(displayBuildLogForCommit(logInterpretation),
        DisplayBuildLogParameters, "DisplayBuildLog",
        "interpret and report on a build log",
        "show build log");
}
