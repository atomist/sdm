import { AutomationContextAware, HandlerContext } from "@atomist/automation-client";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { addressEvent } from "@atomist/automation-client/spi/message/MessageClient";
import sprintf from "sprintf-js";
import { disregardApproval, requiresApproval } from "../../../handlers/events/delivery/verify/approvalGate";
import { GoalRootType, GoalState, SdmProvenance, SdmGoal, SdmGoalKey } from "../../../ingesters/goal";
import { Goal, hasPreconditions } from "./Goal";

export function environmentFromGoal(goal: Goal) {
    return goal.definition.environment.replace(/\/$/, ""); // remove trailing slash at least
}

export interface UpdateSdmGoalParams {
    goal: Goal;
    state: GoalState;
    description?: string;
    url?: string;
    approved?: boolean;
}

export function updateGoal(ctx: HandlerContext, before: SdmGoal, params: UpdateSdmGoalParams) {
    const description = params.description || descriptionFromState(params.goal, params.state);
    const approval = params.approved ? constructProvenance(ctx) : before.approval;
    const sdmGoal = {
        ...before,
        state: params.state,
        description,
        url: params.url,
        approval,
        ts: Date.now(),
        provenance: [constructProvenance(ctx)].concat(before.provenance),
    };
    return ctx.messageClient.send(sdmGoal, addressEvent(GoalRootType));
}

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
        throw new Error(sprintf("Please provide a branch in the GitHubRepoRef %j", parameters));
    }
    if (id.sha === null) {
        throw new Error(sprintf("Please provide a sha in the GitHubRepoRef %j", parameters));
    }

    const preConditions: SdmGoalKey[] = [];

    const description = descriptionFromState(goal, state);

    const environment = environmentFromGoal(goal);

    if (hasPreconditions(goal)) {
        preConditions.push(...goal.dependsOn.map(d => ({
            goalSet,
            name: d.name,
            environment: d.definition.environment,
        })));
    }

    const sdmGoal: SdmGoal = {
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

        provenance: [constructProvenance(ctx)],

        preConditions,
    };

    return ctx.messageClient.send(sdmGoal, addressEvent(GoalRootType));
}

function constructProvenance(ctx: HandlerContext): SdmProvenance {
    return {
        registration: (ctx as any as AutomationContextAware).context.name,
        version: (ctx as any as AutomationContextAware).context.version,
        name: (ctx as any as AutomationContextAware).context.operation,
        correlationId: ctx.correlationId,
        ts: Date.now(),
    }
}

export function descriptionFromState(goal: Goal, state: GoalState): string {
    switch (state) {
        case  "planned" :
        case "requested" :
            return goal.requestedDescription;
        case "in_process" :
            return goal.inProcessDescription;
        case "waiting_for_approval" :
            return goal.waitingForApprovalDescription;
        case "success" :
            return goal.successDescription;
        case "failure" :
            return goal.failureDescription;
        case "skipped":
            return "Skipped"; // you probably want to use something that describes the reason instead. but don't error.
        default:
            throw new Error("Unknown goal state " + state);
    }
}
