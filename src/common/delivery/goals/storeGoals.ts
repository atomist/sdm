import { AutomationContextAware, HandlerContext } from "@atomist/automation-client";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { addressEvent } from "@atomist/automation-client/spi/message/MessageClient";
import { disregardApproval, requiresApproval } from "../../../handlers/events/delivery/verify/approvalGate";
import { Goal as SDMGoal, GoalKey as SDMGoalKey, GoalRootType, GoalState } from "../../../ingesters/goal";
import { Goal, hasPreconditions } from "./Goal";

export function storeGoal(ctx: HandlerContext, parameters: {
    goalSet: string,
    goal: Goal,
    state: GoalState,
    id: GitHubRepoRef,
    providerId: string
    url?: string,
}): Promise<any> {
    const {goalSet, goal, state, id, providerId, url} = parameters;

    if (id.branch === null) {
        throw new Error("Please provide a branch in the GitHubRepoRef");
    }
    if (id.sha === null) {
        throw new Error("Please provide a sha in the GitHubRepoRef");
    }

    const preConditions: SDMGoalKey[] = [];

    const description = goal.requestedDescription;

    const environment = goal.definition.environment.replace(/\/$/, ""); // remove trailing slash at least

    if (hasPreconditions(goal)) {
        preConditions.push(...goal.dependsOn.map(d => ({
            goalSet,
            name: d.name,
            environment: d.definition.environment,
        })));
    }

    const sdmGoal: SDMGoal = {
        goalSet,
        name: goal.name,
        environment,

        sha: id.sha,
        branch: id.branch,

        repo: {
            name: id.repo,
            owner: id.owner,
            providerId,
        },

        state,
        description,
        url: disregardApproval(url), // when we use goals in lifecycle this can go
        externalKey: goal.context,
        ts: Date.now(),

        requiresApproval: requiresApproval({targetUrl: url}), // this may be able to go away, being dynamic instead. but graphing...

        provenance: [{
            registration: (ctx as any as AutomationContextAware).context.name,
            version: (ctx as any as AutomationContextAware).context.version,
            name: (ctx as any as AutomationContextAware).context.operation,
            correlationId: ctx.correlationId,
            ts: Date.now(),
        }],

        preConditions,
    };

    return ctx.messageClient.send(sdmGoal, addressEvent(GoalRootType));
}
