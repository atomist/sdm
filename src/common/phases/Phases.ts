import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import {
    ProjectOperationCredentials,
    TokenCredentials,
} from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { StatusState } from "../../typings/types";
import { createStatus } from "../../util/github/ghub";

import { logger } from "@atomist/automation-client";
import * as stringify from "json-stringify-safe";
import { contextToKnownPhase } from "../../handlers/events/delivery/phases/httpServicePhases";
import { ApprovalGateParam } from "../../handlers/events/delivery/verify/approvalGate";
import { BaseContext, GitHubStatusContext, PhaseEnvironment } from "./gitHubContext";

export interface PlannedPhaseDefinition {
    environment: PhaseEnvironment;
    orderedName: string;
    displayName?: string;
    completedDescription?: string;
    workingDescription?: string;
}

export class PlannedPhase {
    public readonly context: GitHubStatusContext;
    public readonly name: string;
    private readonly definition: PlannedPhaseDefinition;

    get completedDescription() {
        return this.definition.completedDescription || ("Complete: " + this.name);
    }

    get workingDescription() {
        return this.definition.workingDescription || ("Working: " + this.name);
    }

    constructor(definition: PlannedPhaseDefinition) {
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
}

/**
 * Represents the phases of a delivery
 */
export class Phases {

    constructor(public phases: PlannedPhase[]) {
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

export function nothingFailed(status: GitHubStatusAndFriends): boolean {
    return !status.siblings.some(sib => ["failure", "error"].includes(sib.state));
}

export function previousPhaseSucceeded(expectedPhases: Phases, currentContext: GitHubStatusContext, status: GitHubStatusAndFriends): boolean {
    const currentPhase = contextToKnownPhase(currentContext);
    if (!currentPhase) {
        logger.warn("Unknown context! Returning false from previousPhaseSucceeded: " + currentContext);
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

    const whereAmI = expectedPhases.phases.indexOf(currentPhase);
    if (whereAmI < 0) {
        logger.warn(`Inconsistency! Phase ${currentPhase} is known but is not part of Phases ${stringify(expectedPhases)}`);
        return false;
    }
    if (whereAmI === 0) {
        logger.info(`${currentPhase} is the first step.`);
        return true;
    }
    // TODO: check the order of the statuses the commit has, instead of knowing which ones were planned
    const previousPhase = expectedPhases.phases[whereAmI - 1];
    if (previousPhase.context === status.context) {
        return true;
    } else {
        logger.info("%j is right before %j; ignoring success of %s",
            previousPhase, currentPhase, status.context);
        return false;
    }
}
