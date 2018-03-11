import { HandleCommand } from "@atomist/automation-client";
import { commandHandlerFrom } from "@atomist/automation-client/onCommand";
import { HttpServiceGoals } from "../../../handlers/events/delivery/goals/httpServiceGoals";
import { ApplyGoalsParameters, applyGoalsToCommit } from "../../../handlers/events/delivery/goals/SetGoalsOnPush";

export const applyHttpServiceGoals: HandleCommand<ApplyGoalsParameters> =
    commandHandlerFrom(applyGoalsToCommit(HttpServiceGoals),
        ApplyGoalsParameters, "ApplyHttpServiceGoals",
        "reset goals for an http service",
        "trigger sdm for http service");
