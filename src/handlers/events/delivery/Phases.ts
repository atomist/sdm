import { GitHubRepoRef } from "@atomist/automation-client/operations/common/GitHubRepoRef";
import {
    ProjectOperationCredentials,
    TokenCredentials,
} from "@atomist/automation-client/operations/common/ProjectOperationCredentials";
import { StatusState } from "../../../typings/types";
import { createStatus, State, Status } from "../../commands/editors/toclient/ghub";

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

// TODO move these later
export const ScanContext = "1. code scan";
export const ArtifactContext = "2. create artifact";
export const StagingDeploymentContext = "3. deploy:staging";
export const StagingEndpointContext = "4. starting endpoint:staging";
export const StagingVerifiedContext = "5. verified:staging";

function setStatus(id: GitHubRepoRef, context: string, state: State, creds: ProjectOperationCredentials): Promise<any> {
    return createStatus((creds as TokenCredentials).token, id, {
        state,
        target_url: `${id.apiBase}/${id.owner}/${id.repo}/${id.sha}`,
        context,
    });
}
