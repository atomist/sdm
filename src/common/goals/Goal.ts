import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import {
    ProjectOperationCredentials,
    TokenCredentials,
} from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { OnAnySuccessStatus, StatusState } from "../../typings/types";
import { createStatus } from "../../util/github/ghub";

import { logger } from "@atomist/automation-client";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import * as stringify from "json-stringify-safe";
import { contextToKnownGoal } from "../../handlers/events/delivery/goals/httpServiceGoals";
import { ApprovalGateParam } from "../../handlers/events/delivery/verify/approvalGate";
import { BaseContext, GitHubStatusContext, GoalEnvironment } from "./gitHubContext";

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
                                  sub: OnAnySuccessStatus.Subscription): Promise<boolean> {
        return true;
    }
}

export class GoalWithPrecondition extends Goal {

    public readonly dependsOn: Goal[];

    constructor(definition: GoalDefinition, ...dependsOn: Goal[]) {
        super(definition);
        this.dependsOn = dependsOn;
    }

    public async preconditionsMet(creds: ProjectOperationCredentials, id: RemoteRepoRef, sub: OnAnySuccessStatus.Subscription): Promise<boolean> {
        const statusesWeNeed = this.dependsOn.map(s => s.context);
        return !sub.Status.some(st => statusesWeNeed.includes(st.context) && st.state !== "success");
    }
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

export function nothingFailed(status: GitHubStatusAndFriends): boolean {
    return !status.siblings.some(sib => ["failure", "error"].includes(sib.state));
}

export function previousGoalSucceeded(expectedGoals: Goals,
                                      currentContext: GitHubStatusContext, status: GitHubStatusAndFriends): boolean {
    const currentGoal = contextToKnownGoal(currentContext);
    if (!currentGoal) {
        logger.warn("Unknown context! Returning false from previousGoalSucceeded: " + currentContext);
        return false;
    }
    if (status.state !== "success") {
        logger.info(`Previous state ${status.context} wasn't success, but [${status.state}]`);
        return false;
    }
    if (status.targetUrl.endsWith(ApprovalGateParam)) {
        logger.info(`Approval gate detected in ${status.context}`);
        return false;
    }

    const whereAmI = expectedGoals.goals.indexOf(currentGoal);
    if (whereAmI < 0) {
        logger.warn(`Inconsistency! Goal ${currentGoal} is known but is not part of Goals ${stringify(expectedGoals)}`);
        return false;
    }
    if (whereAmI === 0) {
        logger.info(`${currentGoal} is the first step.`);
        return true;
    }
    // TODO: check the order of the statuses the commit has, instead of knowing which ones were planned
    const prevGoal = expectedGoals.goals[whereAmI - 1];
    if (prevGoal.context === status.context) {
        return true;
    } else {
        logger.info("%j is right before %j; ignoring success of %s",
            prevGoal, currentGoal, status.context);
        return false;
    }
}
