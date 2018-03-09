import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import { ProjectOperationCredentials, TokenCredentials, } from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { StatusState } from "../../typings/types";
import { createStatus } from "../../util/github/ghub";

import { logger } from "@atomist/automation-client";
import { RemoteRepoRef } from "@atomist/automation-client/operations/common/RepoId";
import { BaseContext, GitHubStatusContext, PhaseEnvironment } from "./gitHubContext";

export interface GoalDefinition {
    environment: PhaseEnvironment;
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
        const matchPhase = definition.orderedName.match(numberAndName);
        if (!matchPhase) {
            logger.debug(`Ordered name must be '#-name'. Did not find number and name in ${definition.orderedName}`);
            return;
        }

        this.name = definition.displayName || matchPhase[2];
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

        const statusesWeNeed = this.dependsOn.map(s => s.context);
        return !sub.siblings.some(st => statusesWeNeed.includes(st.context) && st.state !== "success");
    }
}

/**
 * Represents the phases of a delivery
 */
export class Goals {

    constructor(public phases: Goal[]) {
    }

    public setAllToPending(id: GitHubRepoRef, creds: ProjectOperationCredentials): Promise<any> {
        return Promise.all(this.phases.map(phase =>
            setPendingStatus(id, phase.context, creds,
                `Planning to ${phase.name}`)));
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

export function currentPhaseIsStillPending(currentPhase: GitHubStatusContext, status: GitHubStatusAndFriends): boolean {
    const myStatus = status.siblings.find(s => s.context === currentPhase);
    if (!myStatus) {
        // unexpected
        throw new Error("what? I can't find myself. My status.context is " + currentPhase);
    }
    if (myStatus.state === "pending" && myStatus.description.startsWith("Planning")) {
        return true;
    }
    if (myStatus.state === "failure" && myStatus.description.startsWith("Skip")) {
        return true;
    }
    logger.debug(`${currentPhase} is not still planned or skipped, so I'm not running it.
    State: ${myStatus.state} Description: ${myStatus.description}`);
    return false;
}