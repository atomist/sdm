import { logger } from "@atomist/automation-client";
import { goalKeyString, mapKeyToGoal, SdmGoal, SdmGoalKey } from "../../../ingesters/sdmGoalIngester";
import { sprintf } from "sprintf-js";

/*
 * Right now the only preconditions supported are other goals.
 * The intention is that others will be expressed, such as requiring an image.
 */
export async function preconditionsAreMet(goal: SdmGoal, info: {
    goalsForCommit: SdmGoal[], // I would like to make this optional and fetch if needed not provided
}) {
    if (!goal.preConditions || goal.preConditions.length === 0) {
        return true;
    }
    const otherGoalPreconditions = goal.preConditions;
    const falsification = otherGoalPreconditions.find(p => !satisfied(p, info.goalsForCommit));
    return !falsification;
}

function satisfied(preconditionKey: SdmGoalKey, goalsForCommit: SdmGoal[]): boolean {
    const preconditionGoal = mapKeyToGoal(goalsForCommit)(preconditionKey);
    if (!preconditionGoal) {
        logger.error("Precondition %s not found on commit", goalKeyString(preconditionKey));
        return false;
    }
    switch (preconditionGoal.state) {
        case "failure":
        case "skipped":
            logger.info("Precondition %s in state %s, won't be met", goalKeyString(preconditionKey),
                preconditionGoal.state);
            return false;
        case "planned":
        case "requested":
        case "waiting_for_approval":
        case "in_process":
            logger.debug("Not yet. %s in state %s", goalKeyString(preconditionKey),
                preconditionGoal.state);
            return false;
        case "success":
            return true;
        default:
            throw new Error(sprintf("Unhandled state: %s on %s", preconditionGoal.state,
                goalKeyString(preconditionKey)))
    }
}
