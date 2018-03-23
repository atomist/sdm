import { EventFired, EventHandler, HandleEvent, HandlerContext, HandlerResult, logger, Secret, Secrets, Success } from "@atomist/automation-client";
import { subscription } from "@atomist/automation-client/graph/graphQL";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { forApproval } from "../../../handlers/events/delivery/verify/approvalGate";
import * as GoalEvent from "../../../ingesters/goal";
import { GoalState } from "../../../ingesters/goal";
import { OnAnyGoal, ScmProvider, StatusState } from "../../../typings/types";
import { createStatus, State } from "../../../util/github/ghub";
import { fetchProvider } from "../../../util/github/gitHubProvider";

// when
@EventHandler("Copy every SdmGoal to a GitHub Status", subscription({name: "OnAnyGoal"}))
export class CopyGoalToGitHubStatus implements HandleEvent<OnAnyGoal.Subscription> {

    // TODO: @cd why doesn't this work, it doesn't register for the secret
    @Secret(Secrets.OrgToken)
    private githubToken: string = process.env.GITHUB_TOKEN;

    public async handle(event: EventFired<OnAnyGoal.Subscription>, context: HandlerContext, params: this): Promise<HandlerResult> {
        const goal = event.data.SdmGoal[0];
        if (!goal.externalKey) {
            logger.debug("No external key on goal %s. Skipping", goal.name);
            return Success;
        }
        const provider = await fetchProvider(context, goal.repo.providerId);
        const id = GitHubRepoRef.from({
            owner: goal.repo.owner,
            repo: goal.repo.name,
            sha: goal.sha,
            rawApiBase: provider.apiUrl,
            branch: goal.branch,
        });

        const goalState = goal.state as GoalEvent.GoalState;

        const url = goalState === "waiting_for_approval" ? forApproval(goal.url || "https://pretend.atomist.com") : goal.url;

        // TODO this is not what I want to be doing
        await createStatus(process.env.GITHUB_TOKEN, id, {
            context: goal.externalKey,
            description: goal.description,
            target_url: url,
            state: sdmGoalStateToGitHubStatusState(goalState),
        });
        return Success;
    }

}

export function sdmGoalStateToGitHubStatusState(goalState: GoalState): StatusState {
    switch (goalState) {
        case "planned":
        case "requested":
        case "in_process":
            return "pending" as StatusState;
        case "waiting_for_approval":
        case "success":
            return "success" as StatusState;
        case "failure":
        case "skipped":
            return "failure" as StatusState;
        default:
            throw new Error("Unknown goal state " + goalState);
    }
}
