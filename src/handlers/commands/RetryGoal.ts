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
