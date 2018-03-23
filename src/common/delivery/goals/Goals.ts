import {
    AutomationContextAware,
    HandlerContext,
} from "@atomist/automation-client";
import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import {
    ProjectOperationCredentials,
    TokenCredentials,
} from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { addressEvent } from "@atomist/automation-client/spi/message/MessageClient";
import {
    Goal as SDMGoal,
    GoalKey as SDMGoalKey,
    GoalRootType,
} from "../../../ingesters/goal";
import { createStatus } from "../../../util/github/ghub";
import { GitHubStatusContext } from "./gitHubContext";
import {
    Goal,
    GoalWithPrecondition,
} from "./Goal";

/**
 * Represents goals set in response to a push
 */
export class Goals {

    public readonly goals: Goal[];

    constructor(public name: string, ...goals: Goal[]) {
        this.goals = goals;
    }

    public setAllToPending(id: GitHubRepoRef,
                           creds: ProjectOperationCredentials,
                           context: HandlerContext,
                           providerId: string): Promise<any> {

        return Promise.all([
            ...this.goals.map(goal => storePlannedGoal(this.name, goal, id, context, providerId)),
        ]);
    }
}

function setPendingStatus(id: GitHubRepoRef,
                          context: GitHubStatusContext,
                          creds: ProjectOperationCredentials,
                          description: string = context): Promise<any> {
    return createStatus((creds as TokenCredentials).token, id, {
        state: "pending",
        context,
        description,
    });
}

function storePlannedGoal(goalSet: string, goal: Goal, id: GitHubRepoRef, ctx: HandlerContext, providerId: string): Promise<any> {

    const preConditions: SDMGoalKey[] = [];

    const description = goal.requestedDescription;

    const environment = goal.definition.environment.replace(/\/$/, ""); // remove trailing slash at least

    if (goal.hasOwnProperty("dependsOn")) {
        const goalWithPrecondition = goal as GoalWithPrecondition;
        preConditions.push(...goalWithPrecondition.dependsOn.map(d => ({
            goalSet,
            name: d.name,
            environment: d.definition.environment,
        })));
    }

    const sdmGoal: SDMGoal = {
        goalSet,
        name: goal.name, // TODO is this the correct name???
        environment,
        externalKey: goal.context,

        state: "planned",

        sha: id.sha,
        branch: id.branch, // TODO looks like branch is empty in repoRef
        repo: {
            name: id.repo,
            owner: id.owner,
            providerId
        },

        description,

        ts: Date.now(),

        // TODO where is that supposed to come from???
        requiresApproval: false,

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
