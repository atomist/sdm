import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { ProjectOperationCredentials, TokenCredentials } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { StatusState } from "../../typings/types";
import { createStatus } from "../../util/github/ghub";

import { logger } from "@atomist/automation-client";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { BaseContext, GitHubStatusContext, GoalEnvironment } from "./gitHubContext";
import { requiresApproval } from "../../handlers/events/delivery/verify/approvalGate";

export interface GoalDefinition {
    environment: GoalEnvironment;
    orderedName: string;
    displayName?: string;
    completedDescription?: string;
    workingDescription?: string;
}

export class Goal {

    public readonly context: GitHubStatusContext;
    public readonly name: string;
    private readonly definition: GoalDefinition;

    get completedDescription() {
        return this.definition.completedDescription || ("Complete: " + this.name);
    }

    get workingDescription() {
        return this.definition.workingDescription || ("Working: " + this.name);
    }

    constructor(definition: GoalDefinition) {
        this.definition = definition;

        const numberAndName = /([0-9\.]+)-(.*)/;
        const matchGoal = definition.orderedName.match(numberAndName);
        if (!matchGoal) {
            logger.debug(`Ordered name must be '#-name'. Did not find number and name in ${definition.orderedName}`);
            return;
        }

        this.name = definition.displayName || matchGoal[2];
        this.context = BaseContext + definition.environment + definition.orderedName;
    }

    // TODO will decouple from github with statuses
    public async preconditionsMet(creds: ProjectOperationCredentials,
                                  id: RemoteRepoRef,
                                  sub: GitHubStatusAndFriends): Promise<boolean> {
        return true;
    }
}

export class GoalWithPrecondition extends Goal {

    public readonly dependsOn: Goal[];

    constructor(definition: GoalDefinition, ...dependsOn: Goal[]) {
        super(definition);
        this.dependsOn = dependsOn;
    }

    public async preconditionsMet(creds: ProjectOperationCredentials,
                                  id: RemoteRepoRef,
                                  sub: GitHubStatusAndFriends): Promise<boolean> {

        const checks = this.dependsOn.map(pg => checkPreconditionStatus(sub, pg));
        const errors = checks.filter(r => r.error !== undefined).map(r => r.error);
        const reasonsToWait = checks.filter(r => r.wait !== undefined).map(r => r.wait);

        errors.forEach(e => logger.debug("Could not establish preconditions for " + this.name + ": " + e));
        reasonsToWait.forEach(e => logger.debug("Not triggering " + this.name + ": " + e));

        return (errors.length === 0 && reasonsToWait.length === 0);
    }
}

function checkPreconditionStatus(sub: GitHubStatusAndFriends, pg: Goal): { wait?: string, error?: string } {
        const detectedStatus = sub.siblings.find(gs => gs.context === pg.context);
        if (!detectedStatus) {
            return {error: "Did not find a status for " + pg.context};
        }
        if (detectedStatus.state !== "success") {
            return {wait: "Precondition '" + pg.name + "' not yet successful"};
        }
        if (requiresApproval(detectedStatus)) {
            return {wait: "Precondition '" + pg.name + "' requires approval"};
        }
        return {};
}

/**
 * Represents the goals of a delivery
 */
export class Goals {

    constructor(public goals: Goal[]) {
    }

    public setAllToPending(id: GitHubRepoRef, creds: ProjectOperationCredentials): Promise<any> {
        return Promise.all(this.goals.map(goal =>
            setPendingStatus(id, goal.context, creds,
                `Planning to ${goal.name}`)));
    }

}

function setPendingStatus(id: GitHubRepoRef, context: GitHubStatusContext,
                          creds: ProjectOperationCredentials,
                          description: string = context): Promise<any> {
    return createStatus((creds as TokenCredentials).token, id, {
        state: "pending",
        context,
        description,
    });
}

export interface GitHubStatus {
    context?: GitHubStatusContext;
    description?: string;
    state?: StatusState;
    targetUrl?: string;
}

export interface GitHubStatusAndFriends extends GitHubStatus {
    siblings: GitHubStatus[];
}

export function currentGoalIsStillPending(currentGoal: GitHubStatusContext, status: GitHubStatusAndFriends): boolean {
    const myStatus = status.siblings.find(s => s.context === currentGoal);
    if (!myStatus) {
        // unexpected
        throw new Error("what? I can't find myself. My status.context is " + currentGoal);
    }
    if (myStatus.state === "pending" && myStatus.description.startsWith("Planning")) {
        return true;
    }
    if (myStatus.state === "failure" && myStatus.description.startsWith("Skip")) {
        return true;
    }
    logger.debug(`${currentGoal} is not still planned or skipped, so I'm not running it.
    State: ${myStatus.state} Description: ${myStatus.description}`);
    return false;
}