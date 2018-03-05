import { logger } from "@atomist/automation-client";
import { ApprovalGateParam } from "../../handlers/events/delivery/verify/approvalGate";
import { GitHubStatusAndFriends, Phases } from "./Phases";
import { GitHubStatusContext } from "./gitHubContext";
import { contextToKnownPhase } from "../../handlers/events/delivery/phases/httpServicePhases";
import * as stringify from "json-stringify-safe";

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
        logger.info(`${previousPhase} is right before ${currentPhase}; ignoring success of ${status.context}`);
        return false;
    }
}