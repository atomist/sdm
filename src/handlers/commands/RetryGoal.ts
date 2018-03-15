/*
 * Copyright © 2018 Atomist, Inc.
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
import { Goal } from "../../common/goals/Goal";
import { createStatus, tipOfDefaultBranch } from "../../util/github/ghub";

@Parameters()
export class RetryGoalParameters {

    @Secret(Secrets.UserToken)
    public githubToken: string;

    // I think I should be using `target` somehow? because we need provider too
    @MappedParameter(MappedParameters.GitHubOwner)
    public owner: string;

    @MappedParameter(MappedParameters.GitHubRepository)
    public repo: string;

    @Parameter({required: false})
    public sha: string;
}

export function retryGoal(implementationName: string, goal: Goal): HandleCommand {
    return commandHandlerFrom(async (ctx: HandlerContext, commandParams: RetryGoalParameters) => {
        const sha = commandParams.sha || await tipOfDefaultBranch(commandParams.githubToken,
            new GitHubRepoRef(commandParams.owner,
                commandParams.repo));
        const id = new GitHubRepoRef(commandParams.owner, commandParams.repo, sha);
        await createStatus(commandParams.githubToken, id, {
            context: goal.context,
            state: "pending",
            description: goal.requestedDescription,
        });
    }, RetryGoalParameters, retryCommandNameFor(implementationName), "Retry an execution of " + goal.name, goal.retryIntent);
}

export function retryCommandNameFor(deployName: string) {
    return "Retry" + deployName;
}
