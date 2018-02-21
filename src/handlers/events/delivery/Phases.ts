import {GitHubRepoRef} from "@atomist/automation-client/operations/common/GitHubRepoRef";
import {
    ProjectOperationCredentials,
    TokenCredentials,
} from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import {StatusState} from "../../../typings/types";
import {createStatus, State, Status} from "../../commands/editors/toclient/ghub";

import {logger} from "@atomist/automation-client";
import * as stringify from "json-stringify-safe";
import { ApprovalGateParam } from "../gates/StatusApprovalGate";
import {contextIsAfter, splitContext} from "./phases/gitHubContext";

// convention: "sdm/atomist/#-env/#-phase" (the numbers are for ordering)
export type GitHubStatusContext = string;

export interface PlannedPhase {
    context: GitHubStatusContext;
    name: string;
}

// exported for testing
export function parseContext(context: GitHubStatusContext): PlannedPhase {
    return { context, name: splitContext(context).name }
}

export class Phases {

    constructor(public phases: GitHubStatusContext[], private plannedPhaseByContext?: { [key: string]: PlannedPhase }) {
    }

    /**
     * Return next phase if this is a phase
     * @param {string} context
     * @return {GitHubStatusContext}
     */
    public nextPhase(phase: string): GitHubStatusContext {
        const index = this.phases.indexOf(phase);
        if (index !== this.phases.length - 1) {
            return this.phases[index + 1];
        }
        return undefined;
    }

    // TODO method to check whether a status is set

    public setAllToPending(id: GitHubRepoRef, creds: ProjectOperationCredentials): Promise<any> {
        const self = this;
        return Promise.all(this.phases.map(phase =>
            setStatus(id, phase, "pending", creds,
                `Planning to ${self.contextToPlannedPhase(self, phase).name}`)));
    }

    // rod, why the self argument?
    private contextToPlannedPhase(self: this, context: GitHubStatusContext) {
        if (self.plannedPhaseByContext && self.plannedPhaseByContext[context]) {
            return self.plannedPhaseByContext[context];
        } else {
            return parseContext(context);
        }
    }

    /**
     * Set all downstream phase to failure status given a specific failed phase.
     *
     * The phases are associated by the atomist-sdm/${env}/ prefix in their context.
     * This method's only dependency on the enclosing object is for selecting
     * nicer names for the phases.
     *
     * @param {string} failedContext
     * @param {GitHubRepoRef} id
     * @param {ProjectOperationCredentials} creds
     * @return {Promise<any>}
     */
    public gameOver(failedContext: GitHubStatusContext, currentlyPending: GitHubStatusContext[],
                    id: GitHubRepoRef, creds: ProjectOperationCredentials): Promise<any> {
        if (!this.phases.includes(failedContext)) {
            // Don't fail all our outstanding phases because someone else failed an unrelated phase
            return Promise.resolve();
        }
        const failedPhase: PlannedPhase = this.contextToPlannedPhase(this, failedContext);
        const failedPhaseName = failedPhase.name;
        const phasesToReset = currentlyPending
            .filter(pendingContext => contextIsAfter(failedContext, pendingContext))
            .map(p => this.contextToPlannedPhase(this, p));
        return Promise.all(phasesToReset.map(
            p => setStatus(id, p.context, "failure", creds,
                `Skipping ${p.name} because ${failedPhaseName} failed`)));
    }

}

function setStatus(id: GitHubRepoRef, context: GitHubStatusContext,
                   state: State,
                   creds: ProjectOperationCredentials,
                   description: string = context): Promise<any> {
    return createStatus((creds as TokenCredentials).token, id, {
        state,
        target_url: `${id.apiBase}/${id.owner}/${id.repo}/${id.sha}`,
        context,
        description,
    });
}

export interface GitHubStatusAndFriends {

    context: GitHubStatusContext;
    state: StatusState;
    targetUrl: string;
    siblings: Array<{ context?: GitHubStatusContext, state?: StatusState }>;

}

export function currentPhaseIsStillPending(currentPhase: GitHubStatusContext, status: GitHubStatusAndFriends): boolean {
    const result = status.siblings.some(s => s.state === "pending" && s.context === currentPhase);
    if (!result) {
        console.log(`${currentPhase} wanted to run but it wasn't pending`);
    }
    return result;
}

export function nothingFailed(status: GitHubStatusAndFriends): boolean {
    return !status.siblings.some(sib => ["failure", "error"].includes(sib.state));
}

export function previousPhaseSucceeded(expectedPhases: Phases, currentPhase: GitHubStatusContext, status: GitHubStatusAndFriends): boolean {
    if (status.state !== "success" || status.targetUrl.endsWith(ApprovalGateParam)) {
        logger.info(`********* Previous state ${status.context} wasn't success, but [${status.state}]`);
        return false;
    }

    const whereAmI = expectedPhases.phases.indexOf(currentPhase);
    if (whereAmI < 0) {
        logger.warn(`Inconsistency! Phase ${currentPhase} is not part of Phases ${stringify(expectedPhases)}`);
        return false;
    }
    if (whereAmI === 0) {
        logger.info(`${currentPhase} is the first step.`);
        // TODO is this OK?
        return true;
    }
    const previousPhase = expectedPhases.phases[whereAmI - 1];
    if (previousPhase === status.context) {
        return true;
    } else {
        logger.info(`${previousPhase} is right before ${currentPhase}; ignoring success of ${status.context}`);
        return false;
    }
}
