import { HandleCommand } from "@atomist/automation-client";
import { commandHandlerFrom } from "@atomist/automation-client/onCommand";
import { ApplyPhasesParameters, applyPhasesToCommit } from "../../../handlers/events/delivery/phase/SetupPhasesOnPush";
import { HttpServicePhases } from "../../../handlers/events/delivery/phases/httpServicePhases";

export const applyHttpServicePhases: HandleCommand<ApplyPhasesParameters> =
    commandHandlerFrom(applyPhasesToCommit(HttpServicePhases),
        ApplyPhasesParameters, "ApplyHttpServicePhases",
        "reset phases for an http service",
        "trigger sdm for http service");
