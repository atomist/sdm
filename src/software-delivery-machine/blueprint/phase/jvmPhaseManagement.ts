import { HandleCommand } from "@atomist/automation-client";
import { commandHandlerFrom } from "@atomist/automation-client/onCommand";
import { HttpServiceGoals } from "../../../handlers/events/delivery/goals/httpServiceGoals";
import { ApplyPhasesParameters, applyPhasesToCommit } from "../../../handlers/events/delivery/phase/SetupPhasesOnPush";

export const applyHttpServicePhases: HandleCommand<ApplyPhasesParameters> =
    commandHandlerFrom(applyPhasesToCommit(HttpServiceGoals),
        ApplyPhasesParameters, "ApplyHttpServicePhases",
        "reset phases for an http service",
        "trigger sdm for http service");
