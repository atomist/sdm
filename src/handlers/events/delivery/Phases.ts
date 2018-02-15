import {GitHubRepoRef} from "@atomist/automation-client/operations/common/GitHubRepoRef";
import {
    ProjectOperationCredentials,
    TokenCredentials,
} from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import {StatusState} from "../../../typings/types";
import {createStatus, State, Status} from "../../commands/editors/toclient/ghub";

import {logger} from "@atomist/automation-client";
import * as stringify from "json-stringify-safe";
import * as _ from "lodash";

export type GitHubStatusContext = string;

export class Phases {

    constructor(public phases: GitHubStatusContext[]) {
    }

    // TODO method to check whether a status is set

    public setAllToPending(id: GitHubRepoRef, creds: ProjectOperationCredentials): Promise<any> {
        return Promise.all(this.phases.map(phase => setStatus(id, phase, "pending", creds)));
    }

    /**
     * Set all downstream phase to failure status given a specific failed phase
     * @param {string} failedPhase
     * @param {GitHubRepoRef} id
     * @param {ProjectOperationCredentials} creds
     * @return {Promise<any>}
     */
    public gameOver(failedPhase: GitHubStatusContext, currentlyPending: GitHubStatusContext[],
                    id: GitHubRepoRef, creds: ProjectOperationCredentials): Promise<any> {
        if (!this.phases.includes(failedPhase)) {
            // Don't fail all our outstanding phases because someone else failed an unrelated phase
            return Promise.resolve();
        }
        const phasesToReset = currentlyPending
            .filter(phase => this.phases.indexOf(phase) > this.phases.indexOf(failedPhase));
        return Promise.all(phasesToReset.map(context => setStatus(id, context, "failure", creds)));
    }

}

function setStatus(id: GitHubRepoRef, context: string, state: State, creds: ProjectOperationCredentials): Promise<any> {
    return createStatus((creds as TokenCredentials).token, id, {
        state,
        target_url: `${id.apiBase}/${id.owner}/${id.repo}/${id.sha}`,
        context,
    });
}

export interface GitHubStatusAndFriends {

    context: GitHubStatusContext;
    state: StatusState;
    siblings: Array<{ context?: GitHubStatusContext, state?: StatusState }>;

}

export function currentPhaseIsStillPending(currentPhase: GitHubStatusContext, status: GitHubStatusAndFriends): boolean {
    const result = status.siblings.some(s => s.state === "pending" && s.context === currentPhase);
    if (!result) {
        console.log(`${currentPhase} wanted to run but it wasn't pending`);
    }
    return result;
}

export function previousPhaseSucceeded(expectedPhases: Phases, currentPhase: GitHubStatusContext, status: GitHubStatusAndFriends): boolean {
    if (status.state !== "success") {
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
