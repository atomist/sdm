/*
 * Copyright © 2020 Atomist, Inc.
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

import {
    MappedParameter,
    MappedParameters,
    Parameter,
    Parameters,
    Secret,
    Secrets,
} from "@atomist/automation-client/lib/decorators";
import { HandleCommand } from "@atomist/automation-client/lib/HandleCommand";
import { HandlerContext } from "@atomist/automation-client/lib/HandlerContext";
import {
    success,
    Success,
} from "@atomist/automation-client/lib/HandlerResult";
import {
    commandHandlerFrom,
    OnCommand,
} from "@atomist/automation-client/lib/onCommand";
import { GitHubRepoRef } from "@atomist/automation-client/lib/operations/common/GitHubRepoRef";
import {
    chooseAndSetGoals,
    ChooseAndSetGoalsRules,
} from "../../../api-helper/goal/chooseAndSetGoals";
import {
    fetchBranchTips,
    fetchPushForCommit,
    tipOfBranch,
} from "../../util/graph/queryCommits";

@Parameters()
export class DisposeParameters {

    @Secret(Secrets.UserToken)
    public githubToken: string;

    @MappedParameter(MappedParameters.GitHubOwner)
    public owner: string;

    @MappedParameter(MappedParameters.GitHubRepository)
    public repo: string;

    @MappedParameter(MappedParameters.GitHubRepositoryProvider)
    public providerId: string;

    @Parameter({ required: true })
    public areYouSure: string;
}

export function disposeCommand(rules: ChooseAndSetGoalsRules): HandleCommand {
    return commandHandlerFrom(disposeOfProject(rules),
        DisposeParameters,
        "DisposeOfProject",
        "Remove this project from existence",
        ["dispose of this project", "exterminate"]);
}

function disposeOfProject(rules: ChooseAndSetGoalsRules): OnCommand<DisposeParameters> {
    return async (ctx: HandlerContext, commandParams: DisposeParameters) => {
        if (commandParams.areYouSure.toLowerCase() !== "yes") {
            return ctx.messageClient.respond("You didn't say 'yes' to 'are you sure?' so I won't do anything.")
                .then(success);
        }
        const repoData = await fetchBranchTips(ctx, commandParams);
        const branch = repoData.defaultBranch;
        const sha = tipOfBranch(repoData, branch);

        const id = GitHubRepoRef.from({ owner: commandParams.owner, repo: commandParams.repo, sha, branch });
        const push = await fetchPushForCommit(ctx, id, commandParams.providerId);

        const determinedGoals = await chooseAndSetGoals(rules, {
            context: ctx,
            credentials: { token: commandParams.githubToken },
            push,
        });
        if (!determinedGoals) {
            await ctx.messageClient.respond("I don't know how to dispose of this project.");
        }
        return Success;
    };
}
